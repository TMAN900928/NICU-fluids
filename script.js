function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const weight = parseFloat(document.getElementById('weight').value).toFixed(2);
  const fluid = parseFloat(document.getElementById('fluid').value);
  let protein = parseFloat(document.getElementById('protein').value);
  let lipid = parseFloat(document.getElementById('lipid').value);
  const pnType = document.getElementById('pnType').value;

  const ivRateField = document.getElementById('ivRate');
  const ivRate = ivRateField.value === "" ? null : parseFloat(ivRateField.value);
  const nacl = document.getElementById('nacl').value;
  const kclPint = document.getElementById('kcl').value;
  const dextrose = document.getElementById('dextrose').value;

  const warnings = [];

  // Validate IV drip rate
  if (ivRate === null) {
    document.getElementById('results').innerHTML = `<p class="warning">⚠️ IV drip rate is blank. If no IV drip is used, please enter <strong>0</strong>.</p>`;
    return;
  }

  if (ivRate > 0 && (nacl === "" || kclPint === "" || dextrose === "")) {
    document.getElementById('results').innerHTML = `<p class="warning">⚠️ All IV drip parameters (NaCl, KCl, Dextrose) are required when IV drip is used.</p>`;
    return;
  }

  const ageHours = ((now - dob) / (1000 * 60 * 60)).toFixed(1);
  const totalFluidPerDay = fluid * weight;

  const ivVolumePerDay = ivRate * 24;
  const remainingFluid = totalFluidPerDay - ivVolumePerDay;

  if (protein > 4) {
    protein = 4;
    warnings.push("⚠️ Protein target capped at 4 g/kg/day");
  }
  if (lipid > 3) {
    lipid = 3;
    warnings.push("⚠️ Lipid target capped at 3 g/kg/day");
  }

  // Calculate PN rate based on protein
  let pnRate = (protein * weight * 100) / (3.3 * 24);
  let pnVolumePerDay = pnRate * 24;

  // Calculate lipid volume
  let lipidVolume = (lipid * weight * 18) / 3;
  let lipidRate = lipidVolume / 24;

  // Adjust PN rate if fluid limit exceeded
  const totalPlanned = ivVolumePerDay + lipidVolume + pnVolumePerDay;
  let fluidMismatch = false;

  if (totalPlanned > totalFluidPerDay) {
    const maxPNVolume = totalFluidPerDay - ivVolumePerDay - lipidVolume;
    pnVolumePerDay = maxPNVolume;
    pnRate = maxPNVolume / 24;
    protein = (pnRate * 3.3 * 24) / (100 * weight);
    fluidMismatch = true;
  }

  const pnContent = {
    starter: { aa: 2.5, glucose: 10, na: 2, k: 1, phos: 0.5, ca: 0.5, mg: 0.1, cl: 2, ac: 0, kcal: 60, vol: 100 },
    maintenance: { aa: 5, glucose: 20, na: 4, k: 2, phos: 1, ca: 1, mg: 0.2, cl: 4, ac: 0, kcal: 120, vol: 200 },
    concentrated: { aa: 7.5, glucose: 30, na: 6, k: 3, phos: 1.5, ca: 1.5, mg: 0.3, cl: 6, ac: 3, kcal: 180, vol: 300 }
  }[pnType];

  const pnFactor = pnVolumePerDay / pnContent.vol;
  const pnGlucose = pnContent.glucose * pnFactor;
  const gdrPN = (pnGlucose * 1000) / (weight * 1440);

  let ivNa = 0, ivK = 0, ivCl = 0, ivGlucose = 0;
  if (ivRate > 0) {
    const ivNaCl = parseFloat(nacl) * 154;
    const ivKPerL = parseFloat(kclPint) / 0.5;
    ivNa = ivNaCl * ivRate * 24 / 1000 / weight;
    ivCl = ivNa;
    ivK = ivKPerL * ivRate * 24 / 1000 / weight;
    ivGlucose = (parseFloat(dextrose) / 100) * ivRate * 24 / weight;
  }

  const totalGDR = ((pnGlucose + ivGlucose) * 1000) / (weight * 1440);

  if (totalGDR > 12) warnings.push("⚠️ Glucose delivery rate > 12 mg/kg/min");

  const totalDeliveredFluid = (pnVolumePerDay + ivVolumePerDay + lipidVolume) / weight;
  if (totalDeliveredFluid.toFixed(1) < fluid.toFixed(1)) {
    warnings.push(`⚠️ Total fluid delivered = ${totalDeliveredFluid.toFixed(1)} mL/kg/day, which is less than intended ${fluid.toFixed(1)} mL/kg/day due to protein cap`);
  }

  const total = (a, b) => (a + b).toFixed(1);

  document.getElementById('results').innerHTML = `
    <h2>Results</h2>
    <p><strong>Age:</strong> ${ageHours} hours</p>
    <p><strong>Weight:</strong> ${weight} kg</p>
    <p><strong>PN Rate:</strong> ${pnRate.toFixed(1)} mL/hr</p>
    <p><strong>Lipid Rate:</strong> ${lipidRate.toFixed(1)} mL/hr</p>
    <p><strong>GDR:</strong> ${totalGDR.toFixed(1)} mg/kg/min</p>

    <table>
      <tr><th>Component</th><th>From PN</th><th>From IV</th><th>Total (per kg/day)</th></tr>
      <tr><td>Protein (g)</td><td>${protein.toFixed(1)}</td><td>–</td><td>${protein.toFixed(1)}</td></tr>
      <tr><td>Glucose (g)</td><td>${pnGlucose.toFixed(1)}</td><td>${ivGlucose.toFixed(1)}</td><td>${total(pnGlucose, ivGlucose)}</td></tr>
      <tr><td>Sodium (mmol)</td><td>${(pnContent.na * pnFactor / weight).toFixed(1)}</td><td>${ivNa.toFixed(1)}</td><td>${total(pnContent.na * pnFactor / weight, ivNa)}</td></tr>
      <tr><td>Potassium (mmol)</td><td>${(pnContent.k * pnFactor / weight).toFixed(1)}</td><td>${ivK.toFixed(1)}</td><td>${total(pnContent.k * pnFactor / weight, ivK)}</td></tr>
      <tr><td>Chloride (mmol)</td><td>${(pnContent.cl * pnFactor / weight).toFixed(1)}</td><td>${ivCl.toFixed(1)}</td><td>${total(pnContent.cl * pnFactor / weight, ivCl)}</td></tr>
      <tr><td>Calories (kcal)</td><td>${(pnContent.kcal * pnFactor / weight).toFixed(1)}</td><td>–</td><td>${(pnContent.kcal * pnFactor / weight).toFixed(1)}</td></tr>
    </table>

    ${warnings.length ? `<p class="warning">${warnings.join('<br>')}</p>` : ''}
  `;
}
