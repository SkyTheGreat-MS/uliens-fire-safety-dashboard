# Model 2: polynomial logistic regression

Model 2 estimates the observed `test_outcome` label. `SUSTAINED` is the positive
class (1); `EXTINGUISHED` is the negative class (0). The fitted estimator is a
scikit-learn pipeline: scaled numeric inputs and one-hot material encoding,
degree-2 polynomial expansion (including squared terms and pairwise
interactions), scaling of expanded features, and balanced logistic regression.

## Train

From the repository root, install dependencies and train:

```powershell
python -m pip install -r requirements-model2.txt
python -m model2.train
```

Artifacts are written to `models/model2/`: the complete pipeline pickle,
validation metrics, and material metadata. The training command accepts
`--data PATH` to use another CSV with the required columns.

## Import

```python
from model2.inference import Model2

model = Model2()
ranking = model.predict_materials(
    oxygen_pct=21.0,
    pressure_kpa=101.3,
    flow_velocity_cm_s=12.0,
)
curve = model.airflow_curve(
    material="Pmma Cast Acrylic",
    oxygen_pct=21.0,
    pressure_kpa=101.3,
    points=50,
)
candidate = model.reverse_solver(
    material="Pmma Cast Acrylic",
    oxygen_pct=21.0,
    pressure_kpa=101.3,
    cutoff=0.05,
)
```

`predict_materials` ranks highest estimated sustained probability first and
returns both class probabilities, the predicted class, status, material sample
count, and an out-of-material-training-range flag. Status is `HIGH` at
probability >= 0.5, `ELEVATED` from the configured cutoff through < 0.5, and
`LOW` below the cutoff. The default cutoff is 0.05.

`airflow_curve` returns plotting points and defaults to that material's
observed airflow min/max. `reverse_solver` scans that same range at 0.5 cm/s
increments by default and returns the lowest airflow with predicted sustained
probability <= cutoff. Its status is
`candidate_meets_model_cutoff` or `no_supported_point_found`; it does not claim
that a condition is safe. If supplied oxygen or pressure falls outside that
material's observed training range, it returns
`conditions_outside_material_training_range` without a candidate.

## Limits

The holdout is a stratified random split, not grouped by investigation or test
series, so related observations can occur in both partitions. The dataset is
small and imbalanced, and some materials have very few examples or only one
outcome. Probabilities are exploratory and uncalibrated. Out-of-range flags
refer to the selected material's observed oxygen, pressure, and airflow ranges.
These outputs are not validated or certified for operational fire-safety use.
Use a trusted, independently reviewed engineering analysis for any real
ventilation or material-safety decision.
