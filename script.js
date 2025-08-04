function calculate() {
  const dob = new Date(document.getElementById("dob").value);
  const nowInput = document.getElementById("now").value;
  const now = nowInput ? new Date(nowInput) : new Date();

  const wt = parseFloat(document.getElementById("weight").value);
  const fluidInput = parseFloat(document.getElementById("intendedFluid").value);
  const pnType = document.getElementById("pnType").value;

  const proteinG = parseFloat(document.getElementById("proteinG").value);
  const proteinRate = parseFloat(document.getElementById("proteinRate").value);
  const lipidG = parseFloat(document.getElementById("lipidG").value);
  const lipidRate = parseFloat(document.getElementById("lipidRate").value);

  const ivDex = parseFloat(document.getElementById("ivDextrose").value);
  const ivRate = parseFloat(document.getElementById("ivRate").value);
  const ivKcl = parseFloat(document.getElementById("ivKcl").value);

  const feedVolume = parseFloat(document.getElementById("feedVolume").value);
  const feedInterval = parseFloat(document.getElementById("feedInterval").value);

  // Calculate DOL and age in months
  const diffDays = Math.floor((now - dob) / (1000 * 60 * 60 * 24));
  const dol = diffDays + 1;
  const ageMonths = Math.floor(diffDays / 30.5);

  // Fluid recommendation
  let recommended = 0;
  if (dol === 1) recommended = 60;
  else if (dol === 2) recommended = 80;
  else if (dol === 3) recommended = 100;
  else if (dol === 4) recommended = 120;
  else if (ageMonths <= 6) recommended = 150;
  else if (ageMonths <= 12) recommended = 120;
  else {
    let fluid = 0;
    if (wt <= 10) fluid = 100 * wt;
    else if (wt <= 20) fluid = (100 * 10) + ((wt - 10) * 50);
    else fluid = (100 * 10) + (50 * 10) + ((wt - 20) * 20);
    recommended = fluid / wt;
  }

  const expected = wt * recommended;
  const warning = (fluidInput && Math.abs(expected - fluidInput) > 20)
    ? `<div class="warning">⚠️ Intended fluid (${fluidInput.toFixed(1)} mL/day) doesn't match recommended (${expected.toFixed(1)} mL/day)</div>`
    : '';

  // PN data
  const pnData = {
    starter: { dextrose: 10, kcal: 53.2 },
    maintenance: { dextrose: 10, kcal: 52 },
    concentrated: { dextrose: 12.5, kcal: 65.2 }
  };

  const pn = pnData[pnType];
  const pnRate = fluidInput / 24;
  const gdrPN = (pnRate * pn.dextrose) / (wt * 6);
  const kcalPN = pn.kcal * fluidInput / 100;

  // IV calculations
  const gdrIV = (ivRate * ivDex) / (wt * 6);
  const ivVol = ivRate * 24;
  const ivK = (ivKcl / 1000) * ivVol;
  const ivCl = ivK;
  const kcalIV = ivDex * ivRate * 0.0348 * 24;

  // Protein & Lipid sync
  const totalProteinG = proteinG || (proteinRate * 0.1 * 24 / wt);
  const totalProteinRate = proteinRate || ((proteinG * wt) / 0.1 / 24);
  document.getElementById("proteinG").value = totalProteinG.toFixed(2);
  document.getElementById("proteinRate").value = totalProteinRate.toFixed(2);

  const totalLipidG = lipidG || (lipidRate * 0.2 * 24 / wt);
  const totalLipidRate = lipidRate || ((lipidG * wt) / 0.2 / 24);
  document.getElementById("lipidG").value = totalLipidG.toFixed(2);
  document.getElementById("lipidRate").value = totalLipidRate.toFixed(2);
  const kcalLipid = totalLipidG * 10;

  // Feeds
  const feedCount = 24 / feedInterval;
  const totalFeeds = feedVolume * feedCount;
  const kcalFeed = totalFeeds * 0.67; // assumed 0.67 kcal/mL
  const gdrFeed = ((totalFeeds / 24) * 7) / (wt * 6); // assume 7% dextrose in milk

  // Totals
  const totalGDR = gdrPN + gdrIV + gdrFeed;
  const totalKcal = kcalPN + kcalIV + kcalLipid + kcalFeed;
  const totalFluid = fluidInput + ivVol + totalFeeds;

  const fluidAlert = Math.abs(totalFluid - fluidInput) > 20
    ? `<div class="warning">⚠️ Total delivered fluid (${totalFluid.toFixed(1)} mL) differs from intended (${fluidInput.toFixed(1)} mL/day)</div>`
    : '';

  document.getElementById("results").innerHTML = `
    <b>Day of Life:</b> ${dol}<br>
    <b>Age:</b> ${ageMonths} months<br><br>

    ${warning}
    ${fluidAlert}

    <p><b>GDR (Total):</b> ${totalGDR.toFixed(2)} mg/kg/min</p>
    <p><b>Total Calories:</b> ${totalKcal.toFixed(1)} kcal/day</p>
    <p><b>Protein:</b> ${totalProteinG.toFixed(2)} g/kg/day → ${totalProteinRate.toFixed(2)} mL/h</p>
    <p><b>Lipid:</b> ${totalLipidG.toFixed(2)} g/kg/day → ${totalLipidRate.toFixed(2)} mL/h</p>
    <p><b>IV K⁺:</b> ${ivK.toFixed(2)} mmol/day</p>
    <p><b>IV Cl⁻:</b> ${ivCl.toFixed(2)} mmol/day</p>
    <p><b>Enteral Feeds:</b> ${totalFeeds.toFixed(1)} mL/day → ${kcalFeed.toFixed(1)} kcal</p>
  `;
}
