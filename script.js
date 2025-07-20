function calculate() {
  const dob = new Date(document.getElementById("dob").value);
  const now = new Date(document.getElementById("now").value);
  const ageHours = Math.floor((now - dob) / 36e5);
  const weight = parseFloat(document.getElementById("weight").value);
  const totalFluid = parseFloat(document.getElementById("fluid").value);

  const feedTypeChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;
  const feedType = document.getElementById("feedTypeSelect").value;
  const feedData = {
    preterm_breastmilk:  { kcal: 74, carb: 6.4, Na: 17, K: 29, Ca: 74, Phos: 67 },
    preterm_formula:     { kcal: 80, carb: 8.6, Na: 14, K: 41, Ca: 77, Phos: 67 },
    mature_breastmilk:   { kcal: 70, carb: 7.4, Na: 6.4, K: 35, Ca: 15, Phos: 8 },
    standard_formula:    { kcal: 67, carb: 7.5, Na: 14, K: 46, Ca: 33, Phos: 80 }
  };

  const feedComp = feedData[feedType];
  let feedVolumePerDay = 0;

  if (feedTypeChoice === "full") {
    // FULL FEEDS ONLY — calculate feed + GDR
    feedVolumePerDay = (totalFluid * weight);
    const GDR = ((feedVolumePerDay / 100) * feedComp.carb * 10) / (weight * 6); // mg/kg/min
    const perFeed = feedVolumePerDay / 8;

    document.getElementById("results").innerHTML = `
      <h2>Full Feeds Summary</h2>
      <p><strong>Total Feed Volume:</strong> ${feedVolumePerDay.toFixed(1)} mL/day (${(feedVolumePerDay / weight).toFixed(1)} mL/kg/day)</p>
      <p><strong>Per 3-Hourly Feed:</strong> ${perFeed.toFixed(1)} mL</p>
      <p><strong>Glucose Delivery Rate (GDR):</strong> ${GDR.toFixed(2)} mg/kg/min</p>
    `;
    return;
  }

  // PARTIAL FEEDS
  const feedVolume = parseFloat(document.getElementById("feedVolume").value);
  const feedInterval = parseInt(document.getElementById("feedInterval").value);
  feedVolumePerDay = (24 / feedInterval) * feedVolume;
  const feedPerKg = feedVolumePerDay / weight;

  const kcalFromFeed = (feedPerKg / 100) * feedComp.kcal;
  const GDRfeed = ((feedVolumePerDay / 100) * feedComp.carb * 10) / (weight * 6);
  const NaFromFeed = (feedComp.Na * feedPerKg) / 1000;
  const KFromFeed = (feedComp.K * feedPerKg) / 1000;
  const CaFromFeed = (feedComp.Ca * feedPerKg) / 100;
  const PhosFromFeed = (feedComp.Phos * feedPerKg) / 100;

  const remainingFluid = totalFluid - feedPerKg;

  // IV INPUTS
  const ivRate = parseFloat(document.getElementById("ivRate").value);
  if (isNaN(ivRate)) {
    document.getElementById("results").innerHTML = `<p class="warning">⚠️ Please enter IV rate. If no IV used, enter 0.</p>`;
    return;
  }
  const nacl = parseFloat(document.getElementById("nacl").value) || 0;
  const kcl = parseFloat(document.getElementById("kcl").value) || 0;
  const dextrose = parseFloat(document.getElementById("dextrose").value) || 0;

  const ivVolumePerDay = ivRate * 24;
  const ivPerKg = ivVolumePerDay / weight;
  const NaFromIV = (nacl * ivPerKg);
  const KFromIV = (kcl / 1000) * (ivVolumePerDay / weight);
  const kcalFromIV = ((dextrose / 100) * ivVolumePerDay * 3.4) / weight;
  const GDRiv = (ivRate * dextrose) / (weight * 6);

  // PN INPUTS
  const proteinTarget = Math.min(parseFloat(document.getElementById("protein").value), 4);
  const pnType = document.getElementById("pnType").value;
  const pnData = {
    starter:       { aa: 3.3, glucose: 10, Na: 3, K: 0, Ca: 1.4, Mg: 0.25, Cl: 0, Acetate: 0, Phos: 1.5, TE: 0, kcal: 53.2 },
    maintenance:   { aa: 3.0, glucose: 10, Na: 3, K: 2, Ca: 0.15, Mg: 0.22, Cl: 2, Acetate: 0, Phos: 1.5, TE: 0.74, kcal: 52 },
    concentrated:  { aa: 3.8, glucose: 12.5, Na: 4, K: 2.7, Ca: 0.15, Mg: 0.25, Cl: 2.7, Acetate: 1, Phos: 1.5, TE: 0.74, kcal: 65.2 }
  };
  const pnComp = pnData[pnType];

  const maxPNrate = (remainingFluid - ivPerKg);
  const pnRate = Math.min(((proteinTarget * weight * 100) / (pnComp.aa * 24)), maxPNrate);
  const actualPNmlPerDay = pnRate * 24;
  const actualPNmlPerKgDay = actualPNmlPerDay / weight;

  const aa = (actualPNmlPerKgDay / 100) * pnComp.aa;
  const glucose = (actualPNmlPerKgDay / 100) * pnComp.glucose;
  const kcalFromPN = (actualPNmlPerKgDay / 100) * pnComp.kcal;
  const GDRpn = ((pnRate * pnComp.glucose) / (weight * 6));

  const NaFromPN = (actualPNmlPerKgDay / 100) * pnComp.Na;
  const KFromPN = (actualPNmlPerKgDay / 100) * pnComp.K;
  const CaFromPN = (actualPNmlPerKgDay / 100) * pnComp.Ca;
  const MgFromPN = (actualPNmlPerKgDay / 100) * pnComp.Mg;
  const ClFromPN = (actualPNmlPerKgDay / 100) * pnComp.Cl;
  const Acetate = (actualPNmlPerKgDay / 100) * pnComp.Acetate;
  const PhosFromPN = (actualPNmlPerKgDay / 100) * pnComp.Phos;
  const TE = (actualPNmlPerKgDay / 100) * pnComp.TE;

  // Lipid Auto
  let lipidRate = 0, lipidGrams = 0, lipidKcal = 0;
  if (ageHours < 24) {
    lipidRate = 6; lipidGrams = 1.07; lipidKcal = 10.8;
  } else if (ageHours < 48) {
    lipidRate = 12; lipidGrams = 2.13; lipidKcal = 21.6;
  } else {
    lipidRate = 18; lipidGrams = 3.2; lipidKcal = 32.4;
  }

  const totalDelivered = feedPerKg + ivPerKg + actualPNmlPerKgDay;
  const fluidDeficit = totalDelivered < totalFluid;
  const suggestedDrip = ((totalFluid - totalDelivered) * weight) / 24;

  let output = `<h2>Partial Feeds Summary</h2>
    <p><strong>Feed Volume:</strong> ${feedPerKg.toFixed(1)} mL/kg/day</p>
    <p><strong>IV Volume:</strong> ${ivPerKg.toFixed(1)} mL/kg/day</p>
    <p><strong>PN Volume:</strong> ${actualPNmlPerKgDay.toFixed(1)} mL/kg/day</p>
    <p><strong>Lipid Volume:</strong> ${lipidRate.toFixed(1)} mL/kg/day</p>
    <p><strong>Calories:</strong> ${(kcalFromFeed + kcalFromIV + kcalFromPN + lipidKcal).toFixed(1)} kcal/kg/day</p>
    <p><strong>GDR:</strong> ${(GDRfeed + GDRiv + GDRpn).toFixed(2)} mg/kg/min</p>
    <p><strong>Protein Delivered:</strong> ${aa.toFixed(2)} g/kg/day</p>
    <p><strong>Lipid Delivered:</strong> ${lipidGrams.toFixed(2)} g/kg/day</p>

    <h3>Electrolytes & Micronutrients</h3>
    <p><strong>Sodium:</strong> ${(NaFromFeed + NaFromIV + NaFromPN).toFixed(2)} mmol/kg/day</p>
    <p><strong>Potassium:</strong> ${(KFromFeed + KFromIV + KFromPN).toFixed(2)} mmol/kg/day</p>
    <p><strong>Calcium:</strong> ${(CaFromFeed + CaFromPN).toFixed(2)} mmol/kg/day</p>
    <p><strong>Phosphate:</strong> ${(PhosFromFeed + PhosFromPN).toFixed(2)} mmol/kg/day</p>
    <p><strong>Magnesium:</strong> ${MgFromPN.toFixed(2)} mmol/kg/day</p>
    <p><strong>Acetate:</strong> ${Acetate.toFixed(2)} mmol/kg/day</p>
    <p><strong>Chloride:</strong> ${ClFromPN.toFixed(2)} mmol/kg/day</p>
    <p><strong>Trace Elements:</strong> ${TE.toFixed(2)} mL/kg/day</p>`;

  if (fluidDeficit) {
    output += `<p class="warning">⚠️ Fluid delivered is only ${totalDelivered.toFixed(1)} mL/kg/day (less than intended ${totalFluid} mL/kg/day)</p>
      <p class="warning">💧 Suggest adding IV drip: ~${suggestedDrip.toFixed(1)} mL/hr to match target.</p>`;
  }

  document.getElementById("results").innerHTML = output;
}
