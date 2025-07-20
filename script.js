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

  let ivRate = document.getElementById('ivRate').value;
  const nacl = parseFloat(document.getElementById('nacl').value);
  const kcl = parseFloat(document.getElementById('kcl').value);
  const dextrose = parseFloat(document.getElementById('dextrose').value);

  if (ivRate === "") {
    alert("Please enter 0 in IV rate if no IV drip is used.");
    return;
  }

  ivRate = parseFloat(ivRate);

  if (ivRate > 0 && (isNaN(nacl) || isNaN(kcl) || isNaN(dextrose))) {
    alert("For IV rate > 0, please fill in sodium chloride strength, KCl, and dextrose %.");
    return;
  }

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
  const feedPerDay = feedChoice === 'full' ? (totalFluid * weight) : (24 / feedInterval) * feedVolume;
  const feedPerKg = feedPerDay / weight;

  if (feedPerKg > totalFluid) {
    alert(`⚠️ Feed volume exceeds total fluid intended (${feedPerKg.toFixed(1)} > ${totalFluid} mL/kg/day). Please review target fluid or feeding plan.`);
    return;
  }

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

  // From here, continue with existing PN + IVD calculations...
  // Let me know if you'd like me to send the remaining JS block again!
}
