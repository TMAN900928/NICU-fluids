function toggleSections() {
  const feedChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;
  const showPartial = feedChoice !== 'full';

  document.getElementById('pnSection').style.display = showPartial ? 'block' : 'none';
  document.getElementById('lipidSection').style.display = showPartial ? 'block' : 'none';
  document.getElementById('ivSection').style.display = showPartial ? 'block' : 'none';
  document.getElementById('feedInputs').style.display = showPartial ? 'block' : 'none';
}

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
document.addEventListener("DOMContentLoaded", toggleSections);

function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const ageHours = Math.floor((now - dob) / 36e5);
  const day = Math.floor(ageHours / 24) + 1;

  const weight = parseFloat(document.getElementById('weight').value);
  const totalFluid = parseFloat(document.getElementById('fluid').value);
  const feedChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;

  const feedType = document.getElementById('feedTypeSelect').value;
  const feedData = {
    preterm_breastmilk: { kcal: 74, carb: 6.4 },
    preterm_formula: { kcal: 80, carb: 8.6 },
    mature_breastmilk: { kcal: 70, carb: 7.4 },
    standard_formula: { kcal: 67, carb: 7.5 }
  };
  const feedComp = feedData[feedType];

  let feedPerDay = 0;
  if (feedChoice === 'full') {
    feedPerDay = totalFluid * weight;
  } else {
    const feedVolume = parseFloat(document.getElementById('feedVolume').value) || 0;
    const feedInterval = parseFloat(document.getElementById('feedInterval').value) || 3;
    feedPerDay = (24 / feedInterval) * feedVolume;
  }

  const feedPerKg = feedPerDay / weight;
  const feedKcal = (feedPerDay * feedComp.kcal) / weight / 100;
  const feedRate = feedPerDay / 24;
  const GDRfeed = (feedRate * feedComp.carb * 10) / (weight * 6); // bedside formula

  if (feedChoice === 'full') {
    document.getElementById('results').innerHTML = `
      <h2>Full Feeds</h2>
      <p><strong>Feed Volume (3-hourly):</strong> ${(feedPerDay / 8).toFixed(1)} mL</p>
      <p><strong>GDR (Glucose Delivery Rate):</strong> ${GDRfeed.toFixed(2)} mg/kg/min</p>
      <p><strong>Calories from Feeds:</strong> ${feedKcal.toFixed(1)} kcal/kg/day</p>
    `;
    return;
  }

  let maxProtein = 4, maxLipid = 18;
  if (day === 1) { maxProtein = 1; maxLipid = 6; }
  else if (day === 2) { maxProtein = 2; maxLipid = 12; }
  else if (day === 3) { maxProtein = 3; }

  const pnType = document.getElementById('pnType').value;
  if (pnType === 'starter' && day > 1) {
    alert("Starter PN should not be used after 24 hours of life.");
    return;
  }

  const proteinTarget = Math.min(parseFloat(document.getElementById('protein').value) || 0, maxProtein);
  const lipidTargetG = parseFloat(document.getElementById('lipidTarget').value) || 0;
  const lipidTarget = Math.min(lipidTargetG, maxLipid * 0.178);

  const ivRate = parseFloat(document.getElementById('ivRate').value);
  let nacl = parseFloat(document.getElementById('nacl').value);
  let kcl = parseFloat(document.getElementById('kcl').value);
  let dextrose = parseFloat(document.getElementById('dextrose').value);

  if (isNaN(ivRate)) return alert("If no IV drip is used, enter 0 in IV rate.");
  if (ivRate === 0) {
    kcl = 0;
    dextrose = 0;
  } else if (isNaN(nacl) || isNaN(kcl) || isNaN(dextrose)) {
    return alert("When IV rate > 0, NaCl, KCl, and Dextrose must be filled.");
  }

  const pnFluids = {
    starter: { aa: 3.3, gl: 10, Na: 3, K: 0, Ca: 1.4, Mg: 0.25, Cl: 0, Ac: 0, Ph: 1.5, TE: 0, kcal: 53.2 },
    maintenance: { aa: 3.0, gl: 10, Na: 3, K: 2, Ca: 0.15, Mg: 0.22, Cl: 2, Ac: 0, Ph: 1.5, TE: 0.74, kcal: 52 },
    concentrated: { aa: 3.8, gl: 12.5, Na: 4, K: 2.7, Ca: 0.15, Mg: 0.25, Cl: 2.7, Ac: 1, Ph: 1.5, TE: 0.74, kcal: 65.2 }
  };
  const pn = pnFluids[pnType];

  const pnVolume = (proteinTarget * 100) / pn.aa;
  const pnRate = (pnVolume * weight) / 24;
  const lipidVolume = (lipidTarget / 0.178);
  const lipidRate = (lipidVolume * weight) / 24;

  const ivVolume = (ivRate * 24) / weight;
  const GDRivd = (ivRate * dextrose * 10) / (weight * 6); // bedside formula
  const GDRpn = (pnRate * pn.gl * 10) / (weight * 6);     // bedside formula

  const totalDelivered = feedPerKg + pnVolume + lipidVolume + ivVolume;
  const fluidDiff = totalFluid - totalDelivered;

  const kcalPn = (pnVolume * pn.kcal) / 100;
  const kcalLipid = lipidVolume * 2;
  const kcalTotal = kcalPn + kcalLipid + feedKcal;

  let msg = `<h2>Combined Nutrition Summary</h2>`;
  msg += `<p><strong>PN Rate:</strong> ${pnRate.toFixed(1)} mL/hr</p>`;
  msg += `<p><strong>Lipid Rate:</strong> ${lipidRate.toFixed(1)} mL/hr</p>`;
  msg += `<p><strong>IVD Rate:</strong> ${ivRate.toFixed(1)} mL/hr</p>`;
  msg += `<p><strong>Total Fluid Delivered:</strong> ${totalDelivered.toFixed(1)} mL/kg/day</p>`;

  if (Math.abs(fluidDiff) > 1) {
    if (fluidDiff > 0) {
      const rateNeeded = (fluidDiff * weight) / 24;
      msg += `<p class="warning">⚠️ Under target by ${fluidDiff.toFixed(1)} mL/kg/day.</p>`;
      msg += `<p><strong>Suggested IVD rate:</strong> ${rateNeeded.toFixed(1)} mL/hr</p>`;
    } else {
      msg += `<p class="warning">⚠️ Over target by ${Math.abs(fluidDiff).toFixed(1)} mL/kg/day.</p>`;
    }
  }

  msg += `<h3>Output per kg/day</h3><ul>`;
  msg += `<li><strong>Protein:</strong> ${proteinTarget.toFixed(1)} g</li>`;
  msg += `<li><strong>Lipid:</strong> ${(lipidVolume * 0.178).toFixed(2)} g</li>`;
  msg += `<li><strong>Glucose:</strong> ${(pnVolume * pn.gl / 100).toFixed(1)} g</li>`;
  msg += `<li><strong>Sodium:</strong> ${(pnVolume * pn.Na / 100 + nacl * ivVolume / 100).toFixed(1)} mmol</li>`;
  msg += `<li><strong>Potassium:</strong> ${(pnVolume * pn.K / 100 + kcl * ivVolume / 500).toFixed(1)} mmol</li>`;
  msg += `<li><strong>Phosphate:</strong> ${(pnVolume * pn.Ph / 100).toFixed(1)} mmol</li>`;
  msg += `<li><strong>Calcium:</strong> ${(pnVolume * pn.Ca / 100).toFixed(2)} mmol</li>`;
  msg += `<li><strong>Magnesium:</strong> ${(pnVolume * pn.Mg / 100).toFixed(2)} mmol</li>`;
  msg += `<li><strong>Chloride:</strong> ${(pnVolume * pn.Cl / 100).toFixed(2)} mmol</li>`;
  msg += `<li><strong>Acetate:</strong> ${(pnVolume * pn.Ac / 100).toFixed(2)} mmol</li>`;
  msg += `<li><strong>Trace Elements:</strong> ${(pnVolume * pn.TE / 100).toFixed(2)} mL</li>`;
  msg += `<li><strong>Calories:</strong> ${kcalTotal.toFixed(1)} kcal/kg/day</li>`;
  msg += `<li><strong>GDR (total):</strong> ${(GDRpn + GDRivd + GDRfeed).toFixed(2)} mg/kg/min</li>`;
  msg += `</ul>`;

  document.getElementById('results').innerHTML = msg;
}
