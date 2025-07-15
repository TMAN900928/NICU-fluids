function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const weight = parseFloat(document.getElementById('weight').value).toFixed(2);
  const fluid = parseFloat(document.getElementById('fluid').value);
  const proteinTarget = parseFloat(document.getElementById('protein').value);
  const lipidTarget = parseFloat(document.getElementById('lipid').value);
  const pnType = document.getElementById('pnType').value;
  const ivRateInput = document.getElementById('ivRate').value;

  const nacl = document.getElementById('nacl').value;
  const kcl = document.getElementById('kcl').value;
  const dextrose = document.getElementById('dextrose').value;

  const warnings = [];

  if (ivRateInput === "") {
    document.getElementById('results').innerHTML = `<p class="warning">⚠️ IV drip rate is blank. If no IV drip is used, please enter <strong>0</strong>.</p>`;
    return;
  }

  const ivRate = parseFloat(ivRateInput);

  if (ivRate > 0 && (nacl === "" || kcl === "" || dextrose === "")) {
    document.getElementById('results').innerHTML = `<p class="warning">⚠️ All IV parameters (NaCl, KCl, Dextrose) are required when IV rate is above 0.</p>`;
    return;
  }

  const ageHours = ((now - dob) / (1000 * 60 * 60)).toFixed(1);
  const totalFluidPerDay = fluid * weight;
  const ivVolumePerDay = ivRate * 24;
  const remainingFluid = totalFluidPerDay - ivVolumePerDay;

  const pnData = {
    starter: {
      aa: 3.3, glucose: 10, na: 3, phos: 1.5, k: 0, ca: 1.4, mg: 0.25, cl: 0, ac: 0, te: 0, kcal: 53.2
    },
    maintenance: {
      aa: 3.0, glucose: 10, na: 3, phos: 1.5, k: 2, ca: 0.15, mg: 0.22, cl: 2, ac: 0, te: 0.74, kcal: 52
    },
    concentrated: {
      aa: 3.8, glucose: 12.5, na: 4, phos: 1.5, k: 2.7, ca: 0.15, mg: 0.25, cl: 2.7, ac: 1, te: 0.74, kcal: 65.2
    }
  }[pnType];

  if (proteinTarget > 4) warnings.push("⚠️ Protein target capped at 4 g/kg/day");
  if (lipidTarget > 3) warnings.push("⚠️ Lipid target capped at 3 g/kg/day");

  const finalProteinTarget = Math.min(proteinTarget, 4);
  const finalLipidTarget = Math.min(lipidTarget, 3);

  const aaConc = pnData.aa;
  let pnVolumePerDay = (finalProteinTarget * weight * 100) / aaConc;
  const lipidVolumePerDay = finalLipidTarget * weight * (100 / 3);

  if (pnVolumePerDay + lipidVolumePerDay > remainingFluid) {
    pnVolumePerDay = remainingFluid - lipidVolumePerDay;
  }

  const pnRate = pnVolumePerDay / 24;
  const lipidRate = lipidVolumePerDay / 24;

  const aaDelivered = (pnVolumePerDay * aaConc) / 100;
  const proteinPerKgDay = (aaDelivered / weight).toFixed(1);

  const pnGlucose = (pnVolumePerDay * pnData.glucose) / 100;
  const ivGlucose = ivRate > 0 ? ((parseFloat(dextrose) / 100) * ivRate * 24) : 0;
  const totalGlucose = pnGlucose + ivGlucose;
  const gdr = ((totalGlucose * 1000) / (weight * 1440)).toFixed(1);

  if (gdr > 12) warnings.push("⚠️ GDR > 12 mg/kg/min");

  const totalFluidDelivered = ((ivVolumePerDay + pnVolumePerDay + lipidVolumePerDay) / weight).toFixed(1);
  if (totalFluidDelivered < fluid.toFixed(1)) {
    warnings.push(`⚠️ Total fluid delivered = ${totalFluidDelivered} mL/kg/day is less than intended ${fluid} mL/kg/day due to protein cap`);
  }

  function perKg(val) {
    return (val * pnVolumePerDay / 100 / weight).toFixed(1);
  }

  function show(val) {
    return (val * pnVolumePerDay / 100).toFixed(1);
  }

  function total(val, iv) {
    return (parseFloat(val) + parseFloat(iv)).toFixed(1);
  }

  const ivNa = ivRate > 0 ? (parseFloat(nacl) * 154 * ivRate * 24 / 1000 / weight).toFixed(1) : "0.0";
  const ivK = ivRate > 0 ? (parseFloat(kcl) / 0.5 * ivRate * 24 / 1000 / weight).toFixed(1) : "0.0";

  document.getElementById('results').innerHTML = `
    <h2>Results</h2>
    <p><strong>Age:</strong> ${ageHours} hours</p>
    <p><strong>Weight:</strong> ${weight} kg</p>
    <p><strong>PN Rate:</strong> ${pnRate.toFixed(1)} mL/hr</p>
    <p><strong>Lipid Rate:</strong> ${lipidRate.toFixed(1)} mL/hr</p>
    <p><strong>GDR:</strong> ${gdr} mg/kg/min</p>

    <table>
      <tr><th>Component</th><th>From PN</th><th>From IV</th><th>Total (per kg/day)</th></tr>
      <tr><td>Amino Acid (g)</td><td>${proteinPerKgDay}</td><td>–</td><td>${proteinPerKgDay}</td></tr>
      <tr><td>Glucose (g)</td><td>${pnGlucose.toFixed(1)}</td><td>${ivGlucose.toFixed(1)}</td><td>${(totalGlucose / weight).toFixed(1)}</td></tr>
      <tr><td>Sodium (mmol)</td><td>${perKg(pnData.na)}</td><td>${ivNa}</td><td>${total(perKg(pnData.na), ivNa)}</td></tr>
      <tr><td>Potassium (mmol)</td><td>${perKg(pnData.k)}</td><td>${ivK}</td><td>${total(perKg(pnData.k), ivK)}</td></tr>
      <tr><td>Phosphate (mmol)</td><td>${perKg(pnData.phos)}</td><td>–</td><td>${perKg(pnData.phos)}</td></tr>
      <tr><td>Calcium (mmol)</td><td>${perKg(pnData.ca)}</td><td>–</td><td>${perKg(pnData.ca)}</td></tr>
      <tr><td>Magnesium (mmol)</td><td>${perKg(pnData.mg)}</td><td>–</td><td>${perKg(pnData.mg)}</td></tr>
      <tr><td>Chloride (mmol)</td><td>${perKg(pnData.cl)}</td><td>–</td><td>${perKg(pnData.cl)}</td></tr>
      <tr><td>Acetate (mmol)</td><td>${perKg(pnData.ac)}</td><td>–</td><td>${perKg(pnData.ac)}</td></tr>
      <tr><td>Trace Elements (mL)</td><td>${perKg(pnData.te)}</td><td>–</td><td>${perKg(pnData.te)}</td></tr>
      <tr><td>Calories (kcal)</td><td>${(pnData.kcal * pnVolumePerDay / 100 / weight).toFixed(1)}</td><td>–</td><td>${(pnData.kcal * pnVolumePerDay / 100 / weight).toFixed(1)}</td></tr>
    </table>

    ${warnings.length ? `<p class="warning">${warnings.join('<br>')}</p>` : ''}
  `;
}
