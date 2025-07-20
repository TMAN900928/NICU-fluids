function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const ageHours = Math.floor((now - dob) / 36e5);
  const day = Math.floor(ageHours / 24) + 1;

  const weight = parseFloat(document.getElementById('weight').value);
  const totalFluid = parseFloat(document.getElementById('fluid').value);
  const feedChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;

  const pnTypeSelect = document.getElementById('pnType');
  const starterOpt = pnTypeSelect.querySelector('option[value="starter"]');
  if (day > 1 && starterOpt) starterOpt.remove();

  const pnType = document.getElementById('pnType').value;
  const proteinTarget = parseFloat(document.getElementById('protein').value) || 0;
  const lipidTarget = parseFloat(document.getElementById('lipidTarget').value) || 0;

  const ivRate = parseFloat(document.getElementById('ivRate').value) || 0;
  const nacl = parseFloat(document.getElementById('nacl').value);
  const kcl = parseFloat(document.getElementById('kcl').value) || 0;
  const dextrose = parseFloat(document.getElementById('dextrose').value) || 0;

  const feedVolume = parseFloat(document.getElementById('feedVolume').value) || 0;
  const feedInterval = parseFloat(document.getElementById('feedInterval').value);
  const feedType = document.getElementById('feedTypeSelect').value;

  const pnFluids = {
    starter: { aa: 3.3, gl: 10, Na: 3, K: 0, Ca: 1.4, Mg: 0.25, Cl: 0, Ac: 0, Ph: 1.5, TE: 0.0, kcal: 53.2 },
    maintenance: { aa: 3.0, gl: 10, Na: 3, K: 2, Ca: 0.15, Mg: 0.22, Cl: 2, Ac: 0, Ph: 1.5, TE: 0.74, kcal: 52 },
    concentrated: { aa: 3.8, gl: 12.5, Na: 4, K: 2.7, Ca: 0.15, Mg: 0.25, Cl: 2.7, Ac: 1, Ph: 1.5, TE: 0.74, kcal: 65.2 }
  };

  const feedData = {
    preterm_breastmilk: { kcal: 74, carb: 6.4, Na: 17, K: 29, Ca: 74, Phos: 67 },
    preterm_formula: { kcal: 80, carb: 8.6, Na: 14, K: 41, Ca: 77, Phos: 67 },
    mature_breastmilk: { kcal: 70, carb: 7.4, Na: 6.4, K: 35, Ca: 15, Phos: 8 },
    standard_formula: { kcal: 67, carb: 7.5, Na: 14, K: 46, Ca: 33, Phos: 80 }
  };

  const feedComp = feedData[feedType];

  // Total feed/day mL
  const feedPerDay = feedChoice === 'full' ? (totalFluid * weight) : (24 / feedInterval) * feedVolume;
  const feedPerKg = feedPerDay / weight;

  const perFeedVolume = (feedPerDay / 8).toFixed(1);
  const GDRfeed = ((feedPerDay / 100) * feedComp.carb * 1000) / (weight * 1440);

  if (feedChoice === 'full') {
    document.getElementById('results').innerHTML = `
      <h2>Full Feeds</h2>
      <p>Feed Volume (3-hourly): <strong>${perFeedVolume} mL</strong></p>
      <p>GDR (Glucose Delivery Rate): <strong>${GDRfeed.toFixed(2)} mg/kg/min</strong></p>
    `;
    return;
  }

  // Caps
  const protCap = day === 1 ? 1 : day === 2 ? 2 : day === 3 ? 3 : 4;
  const lipidCap = day === 1 ? 6 : day === 2 ? 12 : 18;
  const cappedProtein = Math.min(proteinTarget, protCap);
  const cappedLipid = Math.min(lipidTarget, lipidCap);
  const lipidVol = cappedLipid / 0.178; // mL/kg/day

  const remAfterFeed = totalFluid - feedPerKg;

  // PN rate based on capped protein, then capped at remaining fluid
  const selectedPN = pnFluids[pnType];
  const pnRateMax = (cappedProtein * weight * 100) / (selectedPN.aa * 24);
  const pnRate = Math.min(remAfterFeed, pnRateMax);
  const pnVolume = pnRate * 24;
  const pnPerKg = pnVolume / weight;

  const lipidAllowance = Math.min(totalFluid - feedPerKg - pnPerKg, lipidVol);
  const ivAllowance = totalFluid - feedPerKg - pnPerKg - lipidAllowance;
  const ivRateFinal = ivAllowance > 0 ? (ivAllowance * weight) / 24 : 0;

  const Na_feed = (feedComp.Na * feedPerKg) / 1000;
  const K_feed = (feedComp.K * feedPerKg) / 1000;
  const Ca_feed = (feedComp.Ca * feedPerKg) / 100;
  const P_feed = (feedComp.Phos * feedPerKg) / 100;

  const Na_pn = (selectedPN.Na * pnPerKg) / 100;
  const K_pn = (selectedPN.K * pnPerKg) / 100;
  const Ca_pn = (selectedPN.Ca * pnPerKg) / 100;
  const Mg_pn = (selectedPN.Mg * pnPerKg) / 100;
  const Ac_pn = (selectedPN.Ac * pnPerKg) / 100;
  const P_pn = (selectedPN.Ph * pnPerKg) / 100;
  const Cl_pn = (selectedPN.Cl * pnPerKg) / 100;
  const TE = (selectedPN.TE * pnPerKg) / 100;

  const Na_iv = nacl * ivAllowance;
  const K_iv = (kcl / 1000) * (ivAllowance * weight);
  const GDR_iv = (ivRateFinal * dextrose) / (weight * 6);
  const GDR_pn = (pnRate * selectedPN.gl) / (weight * 6);

  const GDR_total = (GDRfeed + GDR_pn + GDR_iv).toFixed(2);

  const totalDelivered = feedPerKg + pnPerKg + lipidAllowance + ivAllowance;
  const fluidDef = totalDelivered < totalFluid;
  const suggestIV = fluidDef ? `⚠️ Delivered only ${totalDelivered.toFixed(1)} mL/kg/day.<br>To meet target, add IV at ${( ((totalFluid - totalDelivered) * weight) / 24 ).toFixed(1)} mL/hr.` : '';

  document.getElementById('results').innerHTML = `
    <h2>Partial Feeds + PN + Lipid + IVD</h2>
    <p><strong>Day of Life:</strong> ${day}</p>
    <p>GDR (total): <strong>${GDR_total} mg/kg/min</strong></p>
    <p>Feed: ${feedPerKg.toFixed(1)} mL/kg/day</p>
    <p>PN: ${pnPerKg.toFixed(1)} mL/kg/day</p>
    <p>Lipid: ${lipidAllowance.toFixed(1)} mL/kg/day (${(lipidAllowance * 0.178).toFixed(2)} g/kg/day)</p>
    <p>IVD: ${ivAllowance.toFixed(1)} mL/kg/day @ ${ivRateFinal.toFixed(1)} mL/hr</p>

    <h3>Electrolyte Delivery (mmol/kg/day)</h3>
    <ul>
      <li>Sodium: ${(Na_feed + Na_pn + Na_iv).toFixed(2)}</li>
      <li>Potassium: ${(K_feed + K_pn + K_iv).toFixed(2)}</li>
      <li>Calcium: ${(Ca_feed + Ca_pn).toFixed(2)}</li>
      <li>Phosphate: ${(P_feed + P_pn).toFixed(2)}</li>
      <li>Magnesium: ${Mg_pn.toFixed(2)}</li>
      <li>Acetate: ${Ac_pn.toFixed(2)}</li>
      <li>Chloride: ${Cl_pn.toFixed(2)}</li>
      <li>Trace Elements: ${TE.toFixed(2)} mL/kg/day</li>
    </ul>
    ${fluidDef ? `<p class="warning">${suggestIV}</p>` : ''}
  `;
}
