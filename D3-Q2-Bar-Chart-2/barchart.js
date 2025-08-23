/* Data Setup */
/* Updated data structure to separate hts and description */
const chinaData = [
    { hts: "848310", description: "TRANSMISSION SHAFTS (INC CAM CCRANK SHAFT), ETC. (HS 848310)", growth: 231.3 },
    { hts: "890590", description: "ELECTROMAGNETS,CLAMPS, SIMILR HLDNG DEVICES C (HS 890590)", growth: 225.8 },
    { hts: "850511", description: "PERMANENT MAGNETS MADE OF METAL (HS 850511)", growth: 214.5 }
];

const feyesData = [
    { hts: "842839", description: "CONTACT ELEV C CONVEY,FR GOODS OR MATERLS, NESOI (HS 842839)", growth: 125.3 },
    { hts: "841350", description: "RECIPROCATING POSITIVE DISPLACEMENT PUMPS, NESOI (HS 841350)", growth: 92.8 },
    { hts: "903010", description: "INST FOR MEASURING/DETECTING IONIZING RADIATIONS (HS 903010)", growth: 90.1 }
];

/* Overall Dimensions and Margins */
const totalWidth = 850;
const totalHeight = 600;
/* Reduced left margin as HTS numbers are shorter than full descriptions */
const margin = { top: 80, right: 60, bottom: 80, left: 100 };

const chartWidth = totalWidth - margin.left - margin.right;
const chartHeight = totalHeight - margin.top - margin.bottom;

/* SVG Container Setup */
const svg = d3.select("#faceted-chart")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("style", "background-color: #f9f9f9; border: 1px dotted #ccc;");

const mainGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

/* Scales */
/* X Scale */
const xScale = d3.scaleLinear()
    .domain([0, 250])
    .range([0, chartWidth]);

/* X Axis Generator */
const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d => d + "%");

/* Y Scales */
const chinaYScale = d3.scaleBand()
    .domain(chinaData.map(d => d.hts)) 
    .range([0, chartHeight / 2 - 20])
    .padding(0.2);

const feyesYScale = d3.scaleBand()
    .domain(feyesData.map(d => d.hts)) 
    .range([chartHeight / 2 + 20, chartHeight])
    .padding(0.2);
    
/* Draw First Chart */
const chinaGroup = mainGroup.append("g").attr("class", "facet-china");

chinaGroup.selectAll(".bar-china")
    .data(chinaData)
    .join("rect")
      .attr("x", xScale(0))
      .attr("y", d => chinaYScale(d.hts)) 
      .attr("width", d => xScale(d.growth))
      .attr("height", chinaYScale.bandwidth())
      .attr("fill", "#D55E00");

chinaGroup.selectAll(".label-china")
    .data(chinaData)
    .join("text")
      .text(d => d.growth.toFixed(1) + "%")
      .attr("x", d => xScale(d.growth) + 5)
      .attr("y", d => chinaYScale(d.hts) + chinaYScale.bandwidth() / 2) 
      .attr("dy", "0.35em")
      .style("font-size", "12px");

/* Draw First Chart's Y Axis */
chinaGroup.append("g").call(d3.axisLeft(chinaYScale));

/* First Chart's Subtitle */
chinaGroup.append("text").attr("x", chartWidth / 2).attr("y", -10).attr("text-anchor", "middle").attr("class", "facet-title").text("China");


/* Draw Second Chart */
const feyesGroup = mainGroup.append("g").attr("class", "facet-feyes");

feyesGroup.selectAll(".bar-feyes")
    .data(feyesData)
    .join("rect")
      .attr("x", xScale(0))
      .attr("y", d => feyesYScale(d.hts)) 
      .attr("width", d => xScale(d.growth))
      .attr("height", feyesYScale.bandwidth())
      .attr("fill", "#0072B2");

feyesGroup.selectAll(".label-feyes")
    .data(feyesData)
    .join("text")
      .text(d => d.growth.toFixed(1) + "%")
      .attr("x", d => xScale(d.growth) + 5)
      .attr("y", d => feyesYScale(d.hts) + feyesYScale.bandwidth() / 2) 
      .attr("dy", "0.35em")
      .style("font-size", "12px");

/* Draw Second Chart Y Axis */
feyesGroup.append("g").call(d3.axisLeft(feyesYScale));

/* Second Chart's Subtitle */
feyesGroup.append("text").attr("x", chartWidth / 2).attr("y", chartHeight / 2).attr("text-anchor", "middle").attr("class", "facet-title").text("Other Five Eyes");


/* Draw the Single, Shared X-Axis at the Bottom */
mainGroup.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis);


/* 8Add Overall Titles and Axis Labels */
/* Main Title */
svg.append("text")
    .attr("x", totalWidth / 2)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("class", "chart-title")
    .text("Top 3 Fastest-Growing Green Exports by Destination (2020-2024)");

/* Subtitle */
svg.append("text")
    .attr("x", totalWidth / 2)
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .attr("class", "chart-subtitle")
    .text("Percentage growth in export value from U.S.");

/* Overall X-Axis Title */
mainGroup.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + 40)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Growth (%)");