function calculate() {
  const wt = parseFloat(document.getElementById("weight").value);
  const dol = parseInt(document.getElementById("dol").value);
  const age = parseInt(document.getElementById("ageMonths").value);
  const pnType = document.getElementById("pnType").value;
  const fluidInput = parseFloat(document.getElementById("intendedFluid").value);
  const ivRate = parseFloat(document.getElementById("ivRate").value);
  const ivDex = parseFloat(document.getElementById("ivDextrose").value);
  const ivKcl = parseFloat(document.getElementById("ivKcl").value);

  // Protein / Lipid inputs
  const proteinG = parseFloat(document.getElementById("proteinG").value);
  const proteinRate = parseFloat(document.getElementById("proteinRate").value);
  const lipidG = parseFloat(document.getElementById("lipidG").value);
  const lipidRate = parseFloat(document.getElementById("lipidRate").value);

  // Fluid recommendation logic
  let recommended = 0;
  if (dol === 1) recommended = 60;
  else if (dol === 2) recommended = 80;
  else if (dol === 3) recommended = 100;
  else if (dol === 4) recommended = 120;
  else if (age <= 6) recommended = 150;
  else if (age <= 12) recommended = 120;
  else {
    let fluid = 0;
    if (wt <= 10) fluid = 100 * wt;
    else if (wt <= 20) fluid = (100 * 10) + ((wt - 10) * 50);
    else fluid = (100 * 10) + (50 * 10) + ((wt - 20) * 20);
    recommended = fluid / wt;
  }

  document.getElementById("recommendedFluid").value = recommended.toFixed(1);

  const expected = wt * recommended;
  const warning = (fluidInput && Math.abs(expected - fluidInput) > 20)
    ? `<div class="warning">⚠️ Intended fluid (${fluidInput.toFixed(1)} mL/day) doesn't match recommended (${expected.toFixed(1)} mL/day)</div>`
    : '';

  // PN type data
  const pnData = {
    starter: { dextrose: 10, kcal: 53.2 },
    maintenance: { dextrose: 10, kcal: 52 },
    concentrated: { dextrose: 12.5, kcal: 65.2 }
  };

  const pn = pnData[pnType];
  const pnRate = fluidInput / 24;
  const pnDextrose = (pnRate * pn.dextrose) / (wt * 6);

  // IV GDR
  const ivGdr = (ivRate * ivDex) / (wt * 6);

  // Lipid kcal (20% = 0.2 g/mL → 10 kcal/g)
  let lipidGTotal = lipidG || (lipidRate ? lipidRate * 0.2 * 24 / wt : 0);
  let lipidRateCalc = lipidRate || ((lipidG * wt) / 0.2 / 24);
  const lipidKcal = lipidGTotal * 10;

  document.getElementById("lipidG").value = lipidGTotal.toFixed(2);
  document.getElementById("lipidRate").value = lipidRateCalc.toFixed(2);

  // Protein calculations
  let proteinGTotal = proteinG || (proteinRate ? proteinRate * 0.1 * 24 / wt : 0);
  let proteinRateCalc = proteinRate || ((proteinG * wt) / 0.1 / 24);

  document.getElementById("proteinG").value = proteinGTotal.toFixed(2);
  document.getElementById("proteinRate").value = proteinRateCalc.toFixed(2);

  // IV electrolytes
  const totalIV = ivRate * 24;
  const ivK = (ivKcl / 1000) * totalIV;
  const ivCl = ivK;

  // Totals
  const totalGDR = pnDextrose + ivGdr;
  const totalKcal = pn.kcal * fluidInput / 100 + lipidKcal + ivDex * ivRate * 0.0348 * 24;

  document.getElementById("results").innerHTML = `
    ${warning}
    <p><b>GDR:</b> ${totalGDR.toFixed(2)} mg/kg/min</p>
    <p><b>Total Calories:</b> ${totalKcal.toFixed(1)} kcal/day</p>
    <p><b>Total Protein:</b> ${proteinGTotal.toFixed(2)} g/kg/day → ${proteinRateCalc.toFixed(2)} mL/h</p>
    <p><b>Total Lipid:</b> ${lipidGTotal.toFixed(2)} g/kg/day → ${lipidRateCalc.toFixed(2)} mL/h</p>
    <p><b>IV K⁺:</b> ${ivK.toFixed(2)} mmol/day</p>
    <p><b>IV Cl⁻:</b> ${ivCl.toFixed(2)} mmol/day</p>
  `;
}
