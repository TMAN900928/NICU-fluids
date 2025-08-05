function calculate() {
  const dob = new Date(document.getElementById("dob").value);
  const nowInput = document.getElementById("now").value;
  if (!nowInput) return alert("Current date is required.");
  const now = new Date(nowInput);

  const wt = parseFloat(document.getElementById("weight").value);
  const ageDays = Math.floor((now - dob) / (1000 * 60 * 60 * 24));
  const dol = ageDays + 1;
  const ageMonths = Math.floor(ageDays / 30.5);
  const fluidVal = parseFloat(document.getElementById("intendedFluid").value);

  let totalFluid = 0;
  if (ageMonths < 12) {
    totalFluid = wt * fluidVal;
    document.getElementById("fluidLabel").innerText = "Intended Fluid (mL/kg/day):";
  } else {
    let full = wt <= 10 ? 100 * wt :
               wt <= 20 ? 1000 + (wt - 10) * 50 :
                          1000 + 500 + (wt - 20) * 20;
    totalFluid = full * (fluidVal / 100);
    document.getElementById("fluidLabel").innerText = "Intended Fluid (% of maintenance):";
  }

  // Validate component blocks
  const validateBlock = (fields, label) => {
    const hasValue = fields.some(id => parseFloat(document.getElementById(id).value) > 0);
    const allFilled = fields.every(id => document.getElementById(id).value !== '');
    if (hasValue && !allFilled) {
      alert(`Please complete all ${label} fields or set them all to 0.`);
      throw new Error(`${label} incomplete`);
    }
  };

  validateBlock(["pnType", "proteinG", "proteinRate", "lipidG", "lipidRate"], "PN");
  validateBlock(["ivDextrose", "ivRate", "ivKcl"], "IV Drip");
  validateBlock(["feedType", "feedVolume", "feedInterval"], "Feeding");

  // PN
  const pnType = document.getElementById("pnType").value;
  const pnData = {
    starter: { dex: 10, kcal: 53.2 },
    maintenance: { dex: 10, kcal: 52 },
    concentrated: { dex: 12.5, kcal: 65.2 }
  };
  const pn = pnData[pnType] || { dex: 0, kcal: 0 };
  const pnRate = totalFluid / 24;
  const gdrPN = (pnRate * pn.dex) / (wt * 6);
  const kcalPN = pn.kcal * totalFluid / 100;

  // Protein/lipid
  let pG = parseFloat(document.getElementById("proteinG").value);
  let pR = parseFloat(document.getElementById("proteinRate").value);
  if (pG === 0 && pR > 0) pG = pR * 0.1 * 24 / wt;
  if (pR === 0 && pG > 0) pR = (pG * wt) / 0.1 / 24;

  let lG = parseFloat(document.getElementById("lipidG").value);
  let lR = parseFloat(document.getElementById("lipidRate").value);
  if (lG === 0 && lR > 0) lG = lR * 0.2 * 24 / wt;
  if (lR === 0 && lG > 0) lR = (lG * wt) / 0.2 / 24;
  const kcalLipid = lG * 10;

  // IV
  const ivRate = parseFloat(document.getElementById("ivRate").value);
  const ivDex = parseFloat(document.getElementById("ivDextrose").value);
  const ivKcl = parseFloat(document.getElementById("ivKcl").value);
  const ivVol = ivRate * 24;
  const gdrIV = (ivRate * ivDex) / (wt * 6);
  const kcalIV = ivDex * ivRate * 0.0348 * 24;
  const ivK = (ivKcl / 1000) * ivVol;
  const ivCl = ivK;

  // Feeds
  const feedVol = parseFloat(document.getElementById("feedVolume").value);
  const feedInterval = parseFloat(document.getElementById("feedInterval").value);
  const totalFeeds = (24 / feedInterval) * feedVol;
  const kcalFeed = totalFeeds * 0.67;
  const gdrFeed = ((totalFeeds / 24) * 7) / (wt * 6); // assume 7% dextrose

  const totalGDR = gdrPN + gdrIV + gdrFeed;
  const totalKcal = kcalPN + kcalIV + kcalLipid + kcalFeed;
  const fluidDelivered = totalFluid + ivVol + totalFeeds;

  const fluidWarning = Math.abs(fluidDelivered - totalFluid) > 20
    ? `<div class="warning">⚠️ Delivered fluid (${fluidDelivered.toFixed(1)} mL) differs from intended (${totalFluid.toFixed(1)} mL/day)</div>`
    : '';

  document.getElementById("results").innerHTML = `
    <b>Day of Life:</b> ${dol}<br>
    <b>Age:</b> ${ageMonths} months<br><br>
    ${fluidWarning}
    <p><b>GDR:</b> ${totalGDR.toFixed(2)} mg/kg/min</p>
    <p><b>Total Calories:</b> ${totalKcal.toFixed(1)} kcal/day</p>
    <p><b>Protein:</b> ${pG.toFixed(2)} g/kg/day → ${pR.toFixed(2)} mL/h</p>
    <p><b>Lipid:</b> ${lG.toFixed(2)} g/kg/day → ${lR.toFixed(2)} mL/h</p>
    <p><b>IV K⁺:</b> ${ivK.toFixed(2)} mmol/day</p>
    <p><b>IV Cl⁻:</b> ${ivCl.toFixed(2)} mmol/day</p>
    <p><b>Enteral Feeds:</b> ${totalFeeds.toFixed(1)} mL/day → ${kcalFeed.toFixed(1)} kcal</p>
  `;
}
