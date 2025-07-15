function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const fluid = parseFloat(document.getElementById('fluid').value);
  const protein = parseFloat(document.getElementById('protein').value);
  const lipid = parseFloat(document.getElementById('lipid').value);
  const pnType = document.getElementById('pnType').value;
  const nacl = parseFloat(document.getElementById('nacl').value);
  const kclPint = parseFloat(document.getElementById('kcl').value);
  const dextrose = parseFloat(document.getElementById('dextrose').value);
  const ivRate = parseFloat(document.getElementById('ivRate').value);

  const ageHours = (now - dob) / (1000 * 60 * 60);

  const pnRate = (protein * weight * 100) / (3.3 * 24);
  const lipidRate = (lipid * weight * 18) / (3 * 24);

  const pnContent = {
    starter: { aa: 2.5, glucose: 10, na: 2, k: 1, phos: 0.5, ca: 0.5, mg: 0.1, cl: 2, ac: 0, kcal: 60, vol: 100 },
    maintenance: { aa: 5, glucose: 20, na: 4, k: 2, phos: 1, ca: 1, mg: 0.2, cl: 4, ac: 0, kcal: 120, vol: 200 },
    concentrated: { aa: 7.5, glucose: 30, na: 6, k: 3, phos: 1.5, ca: 1.5, mg: 0.3, cl: 6, ac: 3, kcal: 180, vol: 300 }
  }[pnType];

  // PN-derived values
  const pnFactor = (pnRate * 24) / pnContent.vol;
  const pnAA = pnContent.aa * pnFactor / weight;
  const pnGlucose = pnContent.glucose * pnFactor;
  const pnNa = pnContent.na * pnFactor / weight;
  const pnK = pnContent.k * pnFactor / weight;
  const pnCl = pnContent.cl * pnFactor / weight;
  const pnPhos = pnContent.phos * pnFactor / weight;
  const pnCa = pnContent.ca * pnFactor / weight;
  const pnMg = pnContent.mg * pnFactor / weight;
  const pnAc = pnContent.ac * pnFactor / weight;
  const pnKcal = pnContent.kcal * pnFactor / weight;

  // IV-derived values
  const ivNaCl = nacl * 154; // mmol/L
  const ivK = kclPint / 0.5;  // mmol/L
  const ivGlucose = (dextrose / 100) * ivRate * 24 / weight;

  const ivNa = ivNaCl * ivRate * 24 / 1000 / weight;
  const ivCl = ivNa; // same as Na
  const ivKday = ivK * ivRate * 24 / 1000 / weight;
  const gdrTotal = ((pnGlucose + ivGlucose) * 1000) / weight / 1440;

  const total = (val1, val2) => (val1 + val2).toFixed(2);

  const warn = [];
  if (protein > 4) warn.push("⚠️ Protein > 4 g/kg/day");
  if (lipid > 3) warn.push("⚠️ Lipid > 3 g/kg/day");
  if (gdrTotal > 12) warn.push("⚠️ GDR > 12 mg/kg/min");

  document.getElementById('results').innerHTML = `
    <h2>Results</h2>
    <p><strong>Age:</strong> ${ageHours.toFixed(1)} hours</p>
    <p><strong>PN Rate:</strong> ${pnRate.toFixed(2)} mL/hr</p>
    <p><strong>Lipid Rate:</strong> ${lipidRate.toFixed(2)} mL/hr</p>
    <p><strong>Glucose Delivery Rate:</strong> ${gdrTotal.toFixed(2)} mg/kg/min</p>

    <table>
      <tr><th>Component</th><th>From PN</th><th>From IV</th><th>Total (per kg/day)</th></tr>
      <tr><td>Amino Acid (g)</td><td>${pnAA.toFixed(2)}</td><td>–</td><td>${pnAA.toFixed(2)}</td></tr>
      <tr><td>Glucose (g)</td><td>${pnGlucose.toFixed(2)}</td><td>${ivGlucose.toFixed(2)}</td><td>${total(pnGlucose, ivGlucose)}</td></tr>
      <tr><td>Sodium (mmol)</td><td>${pnNa.toFixed(2)}</td><td>${ivNa.toFixed(2)}</td><td>${total(pnNa, ivNa)}</td></tr>
      <tr><td>Potassium (mmol)</td><td>${pnK.toFixed(2)}</td><td>${ivKday.toFixed(2)}</td><td>${total(pnK, ivKday)}</td></tr>
      <tr><td>Chloride (mmol)</td><td>${pnCl.toFixed(2)}</td><td>${ivCl.toFixed(2)}</td><td>${total(pnCl, ivCl)}</td></tr>
      <tr><td>Phosphate (mmol)</td><td>${pnPhos.toFixed(2)}</td><td>–</td><td>${pnPhos.toFixed(2)}</td></tr>
      <tr><td>Calcium (mmol)</td><td>${pnCa.toFixed(2)}</td><td>–</td><td>${pnCa.toFixed(2)}</td></tr>
      <tr><td>Magnesium (mmol)</td><td>${pnMg.toFixed(2)}</td><td>–</td><td>${pnMg.toFixed(2)}</td></tr>
      <tr><td>Acetate (mmol)</td><td>${pnAc.toFixed(2)}</td><td>–</td><td>${pnAc.toFixed(2)}</td></tr>
      <tr><td>Calories (kcal)</td><td>${pnKcal.toFixed(2)}</td><td>–</td><td>${pnKcal.toFixed(2)}</td></tr>
    </table>

    ${warn.length > 0 ? `<p class="warning">${warn.join('<br>')}</p>` : ''}
  `;
}
