from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.main import app
from app.routes.records import get_db
from app.services.data_loader import get_dataset


MATERIALS = {
    "Kapton Hn", "Nomex Ht90-40", "Paraffin Wax", "Pmma Cast Acrylic",
    "Ptfe Teflon", "Sibal Fabric Blend", "Silicone Rtv-560", "Ultem Polyetherimide",
}
DATASET = "clean_combustion_data_v2"
CONDITIONS = {
    "material": "Pmma Cast Acrylic",
    "oxygen_pct": 21,
    "pressure_kpa": 101.3,
    "flow_velocity_cm_s": 12,
}


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        folder = cls.enterClassContext(TemporaryDirectory())
        engine = create_engine(f"sqlite:///{Path(folder) / 'test.db'}")
        cls.addClassCleanup(engine.dispose)
        cls.enterClassContext(patch("app.main.engine", engine))

        def test_session():
            with Session(engine) as session:
                yield session

        cls.enterClassContext(patch.dict(app.dependency_overrides, {get_db: test_session}))
        cls.client = cls.enterClassContext(TestClient(app))

    def test_versions_catalog_and_full_evaluation(self):
        self.assertEqual(self.client.get("/api/health/health").status_code, 200)
        self.assertEqual(self.client.get("/api/health/ready").status_code, 200)
        catalog = self.client.get("/api/avionics/materials").json()
        self.assertEqual(catalog["dataset_version"], DATASET)
        self.assertEqual(catalog["model_version"], "v2")
        self.assertEqual({row["material_name"] for row in catalog["materials"]}, MATERIALS)
        self.assertEqual(len(catalog["materials"]), 8)

        for material in sorted(MATERIALS):
            with self.subTest(material=material):
                request = {**CONDITIONS, "material": material}
                response = self.client.post("/api/avionics/evaluate", json=request)
                self.assertEqual(response.status_code, 200, response.text)
                data = response.json()
                self.assertEqual(data["inputs"], {
                    **request, "cutoff_probability": 0.05, "spread_threshold_mm_s": 0.5, "sweep_points": 50,
                })
                self.assertEqual(data["dataset_version"], catalog["dataset_version"])
                self.assertEqual({row["material_name"] for row in data["sector_triage"]}, MATERIALS)
                ranking = data["material_risk_ranking"]
                self.assertEqual({row["material_name"] for row in ranking}, MATERIALS)
                probabilities = [row["probability_sustained"] for row in ranking]
                self.assertEqual(probabilities, sorted(probabilities, reverse=True))

                simulation = data["airflow_simulation"]
                self.assertEqual(simulation["material_name"], material)
                points = simulation["sweep_points"]
                self.assertEqual(len(points), 50)
                for index, point in enumerate(points):
                    self.assertAlmostEqual(point["flow_velocity_cm_s"], index * 50 / 49)
                    self.assertLessEqual(point["spread_lower_mm_s"], point["flame_spread_mm_s"])
                    self.assertGreaterEqual(point["spread_upper_mm_s"], point["flame_spread_mm_s"])

                evidence = data["evidence_and_actuation"]
                self.assertEqual(evidence["nasa_provenance"]["material_name"], material)
                self.assertEqual(evidence["reverse_solver_recommendation"], simulation["quench_target"])
                self.assertNotIn("fan_actuation_command", evidence)

    def test_solver_statuses_and_validation(self):
        scenarios = [
            ({}, "no_supported_quench_point_found"),
            ({"oxygen_pct": 0}, "conditions_outside_material_training_range"),
            ({"cutoff_probability": 1, "spread_threshold_mm_s": 10}, "dual_constraint_quench_found"),
            ({"cutoff_probability": 1, "spread_threshold_mm_s": 0}, "probability_cutoff_only_quench_found"),
        ]
        for overrides, status in scenarios:
            with self.subTest(status=status):
                res = self.client.post("/api/avionics/evaluate", json={**CONDITIONS, **overrides})
                self.assertEqual(res.status_code, 200, res.text)
                solver = res.json()["airflow_simulation"]["quench_target"]
                self.assertEqual(solver["status"], status)
                self.assertNotIn("action_summary", solver)
                if status == "dual_constraint_quench_found":
                    self.assertEqual(solver["recommended_flow_velocity_cm_s"], 0)
                    self.assertTrue(solver["satisfies_dual_constraints"])

        zero = self.client.post("/api/avionics/evaluate", json={**CONDITIONS, "cutoff_probability": 0})
        self.assertEqual(zero.json()["inputs"]["cutoff_probability"], 0)
        for invalid in ({"material": "unknown"}, {"sweep_points": 101}, {"cutoff_probability": -1},
                        {"oxygen_pct": "NaN"}, {"spread_threshold_mm_s": -1}, {"pressure_kpa": 0}):
            with self.subTest(invalid=invalid):
                self.assertEqual(self.client.post("/api/avionics/evaluate", json={**CONDITIONS, **invalid}).status_code, 422)

    def test_standalone_models(self):
        self.assertIn("uncertainty_2sigma_mm_s", self.client.post("/api/model1/predict_spread", json=CONDITIONS).json())
        self.assertIn("hazard_regime", self.client.post("/api/model3/predict_regime", json=CONDITIONS).json())
        request = {key: value for key, value in CONDITIONS.items() if key != "material"}
        ranking = self.client.post("/api/model2/predict_materials", json={**request, "cutoff": 0})
        self.assertEqual(ranking.status_code, 200)
        self.assertEqual(len(ranking.json()), 8)
        self.assertTrue(all(row["cutoff"] == 0 for row in ranking.json()))

    def test_dataset_routes(self):
        names = {row["name"] for row in self.client.get("/api/data/").json()}
        self.assertEqual(names, {"clean_combustion_data", DATASET})
        schema = self.client.get(f"/api/data/{DATASET}/schema").json()
        self.assertIn("material_name", schema["schema"])
        rows = self.client.get(f"/api/data/{DATASET}?skip=2&limit=3").json()
        self.assertEqual(len(rows["items"]), 3)
        self.assertEqual(rows["total"], 262)
        self.assertTrue(rows["has_more"])
        stats = self.client.get(f"/api/data/{DATASET}/statistics").json()
        self.assertEqual(stats["stats"]["oxygen_pct"]["count"], 262)
        for suffix in ("", "/schema", "/statistics"):
            self.assertEqual(self.client.get("/api/data/unknown" + suffix).status_code, 404)

    def test_missing_numbers_are_json_null(self):
        with TemporaryDirectory() as folder, patch("app.services.data_loader.DATA_DIR", Path(folder)):
            (Path(folder) / "sparse.csv").write_text("test_id,reading\na,\nb,inf\n", encoding="utf-8")
            try:
                items = self.client.get("/api/data/sparse").json()["items"]
                self.assertEqual([row["data"]["reading"] for row in items], [None, None])
                stats = self.client.get("/api/data/sparse/statistics").json()["stats"]["reading"]
                self.assertEqual((stats["count"], stats["missing"], stats["mean"]), (0, 2, None))
            finally:
                get_dataset.cache_clear()

    def test_sqlite_record_crud(self):
        created = self.client.post("/api/records/", json={"dataset_name": DATASET, "data": {"note": "original"}})
        self.assertEqual(created.status_code, 201, created.text)
        record = created.json()
        path = f"/api/records/{record['id']}"
        self.assertEqual(self.client.get(path).json(), record)
        self.assertEqual(self.client.get("/api/records/", params={"dataset_name": DATASET}).json(), [record])
        self.assertEqual(self.client.put(path, json={"data": {"note": "revised"}}).json()["data"]["note"], "revised")
        self.assertEqual(self.client.delete(path).status_code, 200)
        self.assertEqual(self.client.get(path).status_code, 404)


class UnavailableModelTests(unittest.TestCase):
    def test_readiness_and_evaluation_report_unavailable(self):
        with patch("app.main.Base.metadata.create_all"), patch("app.main.load_pipeline", side_effect=OSError("artifact missing")):
            with self.assertLogs("app.main", level="ERROR"), TestClient(app) as client:
                self.assertEqual(client.get("/api/health/health").status_code, 200)
                self.assertEqual(client.get("/api/health/ready").status_code, 503)
                self.assertEqual(client.get("/api/avionics/materials").status_code, 503)
                self.assertEqual(client.post("/api/avionics/evaluate", json=CONDITIONS).status_code, 503)
