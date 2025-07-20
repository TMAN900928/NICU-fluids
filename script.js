// Feed Section Toggle
function toggleSections() {
  const feedChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;
  document.getElementById('pnSection').style.display = feedChoice === 'full' ? 'none' : 'block';
  document.getElementById('ivSection').style.display = feedChoice === 'full' ? 'none' : 'block';
}

// Feed Preview
function updateFeedPreview() {
  const vol = parseFloat(document.getElementById('feedVolume').value) || 0;
  const interval = parseFloat(document.getElementById('feedInterval').value) || 0;
  const preview = document.getElementById('feedPreview');

  if (vol > 0 && interval > 0) {
    const total = (24 / interval) * vol;
    preview.innerText = `Estimated total enteral feed per day: ${total.toFixed(1)} mL`;
  } else {
    preview.innerText = '';
  }
}

document.getElementById('feedVolume').addEventListener('input', updateFeedPreview);
document.getElementById('feedInterval').addEventListener('change', updateFeedPreview);
toggleSections();

// Main Calculator
function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const ageHours = Math.floor((now - dob) / 36e5);
  const day = Math.floor(ageHours / 24) + 1;

  const weight = parseFloat(document.getElementById('weight').value);
  const totalFluid = parseFloat(document.getElementById('fluid').value);
  const feedChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;

  // PN cap rules
  let maxProtein = 4, maxLipid = 18;
  if (day === 1) { maxProtein = 1; maxLipid = 6; }
  else if (day === 2) { maxProtein = 2; maxLipid = 12; }
  else if (day === 3) { maxProtein = 3; maxLipid = 18; }

  // Hide starter PN if > 24h
  const pnTypeSelect = document.getElementById('pnType');
  const starterOpt = pnTypeSelect.querySelector('option[value="starter"]');
  if (day > 1 && starterOpt) starterOpt.remove();

  const pnType = document.getElementById('pnType').value;
  const proteinTarget = Math.min(parseFloat(document.getElementById('protein').value) || 0, maxProtein);
  const lipidTarget = Math.min(parseFloat(document.getElementById('lipidTarget').value) || 0, maxLipid * 0.178);

  // IVD
  let ivRate = document.getElementById('ivRate').value;
  if (ivRate === "") return alert("Please enter 0 in IV rate if no IV drip is used.");
  ivRate = parseFloat(ivRate);

  const nacl = parseFloat(document.getElementById('nacl').value);
  const kcl = parseFloat(document.getElementById('kcl').value);
  const dextrose = parseFloat(document.getElementById('dextrose').value);

  if (ivRate > 0 && (isNaN(nacl) || isNaN(kcl) || isNaN(dextrose))) {
    return alert("IV rate > 0 requires NaCl strength, KCl, and dextrose % filled.");
  }

  // Feed Info
  const feedVolume = parseFloat(document.getElementById('feedVolume').value) || 0;
  const feedInterval = parseFloat(document.getElementById('feedInterval').value);
  const feedType = document.getElementById('feedTypeSelect').value;

  const feedData = {
    preterm_breastmilk: { kcal: 74, carb: 6.4, Na: 17, K: 29, Ca: 74, Phos: 67 },
    preterm_formula: { kcal: 80, carb: 8.6, Na: 14, K: 41, Ca: 77, Phos: 67 },
    mature_breastmilk: { kcal: 70, carb: 7.4, Na: 6.4, K: 35, Ca: 15, Phos: 8 },
    standard_formula: { kcal: 67, carb: 7.5, Na: 14, K: 46, Ca: 33, Phos: 80 }
  };
  const feedComp = feedData[feedType];
  const feedPerDay = feedChoice === 'full' ? (totalFluid * weight) : (24 / feedInterval) * feedVolume;
  const feedPerKg = feedPerDay / weight;

  if (feedPerKg > totalFluid) {
    alert(`⚠️ Feed volume exceeds total fluid intended (${feedPerKg.toFixed(1)} > ${totalFluid} mL/kg/day).`);
    return;
  }

  const feedKcal = (feedPerDay * feedComp.kcal) / weight / 100;
  const GDRfeed = ((feedPerDay / 100) * feedComp.carb * 1000) / (weight * 1440);

  if (feedChoice === 'full') {
    document.getElementById('results').innerHTML = `
      <h2>Full Feeds</h2>
      <p><strong>Feed Volume (3-hourly):</strong> ${(feedPerDay / 8).toFixed(1)} mL</p>
      <p><strong>GDR (mg/kg/min):</strong> ${GDRfeed.toFixed(2)}</p>
      <p><strong>Calories from Feeds:</strong> ${feedKcal.toFixed(1)} kcal/kg/day</p>
    `;
    return;
  }

  // PN Composition
  const pnFluids = {
    starter: { aa: 3.3, gl: 10, Na: 3, K: 0, Ca: 1.4, Mg: 0.25, Cl: 0, Ac: 0, Ph: 1.5, TE: 0, kcal: 53.2 },
    maintenance: { aa: 3.0, gl: 10, Na: 3, K: 2, Ca: 0.15, Mg: 0.22, Cl: 2, Ac: 0, Ph: 1.5, TE: 0.74, kcal: 52 },
    concentrated: { aa: 3.8, gl: 12.5, Na: 4, K: 2.7, Ca: 0.15, Mg: 0.25, Cl: 2.7, Ac: 1, Ph: 1.5, TE: 0.74, kcal: 65.2 }
  };
  const pn = pnFluids[pnType];

  const pnVolume = (proteinTarget * 100) / pn.aa; // mL/kg/day
  const lipidVolume = (lipidTarget / 0.178); // mL/kg/day
  const ivVolume = (ivRate * 24) / weight;

  const totalDelivered = feedPerKg + pnVolume + lipidVolume + ivVolume;
  const fluidDiff = totalFluid - totalDelivered;
  const GDRpn = ((pnVolume / 100) * pn.gl * 1000) / (weight * 1440);
  const GDRivd = ivRate > 0 ? (((ivVolume / 100) * dextrose * 1000) / (weight * 1440)) : 0;

  const kcalPn = (pnVolume * pn.kcal) / 100;
  const kcalLipid = lipidVolume * 2;
  const kcalTotal = kcalPn + kcalLipid + feedKcal;

  let msg = `<h2>Combined Feeds + PN + IVD</h2>`;
  msg += `<p><strong>PN Volume:</strong> ${pnVolume.toFixed(1)} mL/kg/day</p>`;
  msg += `<p><strong>Lipid Volume:</strong> ${lipidVolume.toFixed(1)} mL/kg/day</p>`;
  msg += `<p><strong>IVD Volume:</strong> ${ivVolume.toFixed(1)} mL/kg/day</p>`;
  msg += `<p><strong>Total Fluid Delivered:</strong> ${totalDelivered.toFixed(1)} mL/kg/day</p>`;

  if (Math.abs(fluidDiff) > 1) {
    msg += `<p class="warning">⚠️ Fluid delivery ${fluidDiff < 0 ? "under" : "over"} target by ${Math.abs(fluidDiff).toFixed(1)} mL/kg/day.</p>`;
    if (fluidDiff > 0) {
      const rateNeeded = (fluidDiff * weight) / 24;
      msg += `<p><strong>Suggested IVD rate to meet target:</strong> ${rateNeeded.toFixed(1)} mL/hr</p>`;
    }
  }

  msg += `<h3>Output per kg/day</h3>`;
  msg += `<ul>
    <li><strong>Protein:</strong> ${proteinTarget.toFixed(1)} g</li>
    <li><strong>Lipid:</strong> ${(lipidVolume * 0.178).toFixed(2)} g</li>
    <li><strong>Glucose:</strong> ${(pnVolume * pn.gl / 100).toFixed(1)} g</li>
    <li><strong>Sodium:</strong> ${(pnVolume * pn.Na / 100 + nacl * ivVolume / 100).toFixed(1)} mmol</li>
    <li><strong>Potassium:</strong> ${(pnVolume * pn.K / 100 + kcl * ivVolume / 500).toFixed(1)} mmol</li>
    <li><strong>Phosphate:</strong> ${(pnVolume * pn.Ph / 100).toFixed(1)} mmol</li>
    <li><strong>Calcium:</strong> ${(pnVolume * pn.Ca / 100).toFixed(2)} mmol</li>
    <li><strong>Magnesium:</strong> ${(pnVolume * pn.Mg / 100).toFixed(2)} mmol</li>
    <li><strong>Chloride:</strong> ${(pnVolume * pn.Cl / 100).toFixed(2)} mmol</li>
    <li><strong>Acetate:</strong> ${(pnVolume * pn.Ac / 100).toFixed(2)} mmol</li>
    <li><strong>Trace Elements:</strong> ${(pnVolume * pn.TE / 100).toFixed(2)} mL</li>
    <li><strong>Calories:</strong> ${kcalTotal.toFixed(1)} kcal/kg/day</li>
    <li><strong>GDR (total):</strong> ${(GDRpn + GDRivd + GDRfeed).toFixed(2)} mg/kg/min</li>
  </ul>`;

  document.getElementById('results').innerHTML = msg;
}
