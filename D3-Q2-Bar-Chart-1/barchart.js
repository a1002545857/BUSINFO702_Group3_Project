/* Data Setup */
/* Updated data structure to separate hts and description */
const chinaTopProducts = [
  { hts: "848180", description: "Taps, cocks, valves (HS 848180)", absChange: 59.8 },
  { hts: "848310", description: "Transmission Shafts (HS 848310)", absChange: 53.2 },
  { hts: "842199", description: "Parts for filtering or purifying machinery (HS 842199)", absChange: 38.6 }
];

const feyesTopProducts = [
  { hts: "848310", description: "Transmission Shafts (HS 848310)", absChange: 46.3 },
  { hts: "854442", description: "Electric Conductors (HS 854442)", absChange: 44.4 },
  { hts: "732690", description: "Articles of Iron or Steel (HS 732690)", absChange: 43.1 }
];

/* To keep the X-axis scale consistent for both charts, find the max value across all data */
const maxAbsChange = d3.max([
    ...chinaTopProducts.map(d => d.absChange),
    ...feyesTopProducts.map(d => d.absChange)
]);


/* Reusable Chart Drawing Function */
function createHorizontalBarChart(containerId, data, color, xDomainMax) {
    /* Dimensions */
    const margin = { top: 20, right: 50, bottom: 50, left: 80 };
    const width = 580 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    /* Create SVG and G container */
    const svg = d3.select(containerId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    /* Scales */
    /* X Scale */
    const xScale = d3.scaleLinear()
        .domain([0, xDomainMax])
        .range([0, width]);

    /* Y Scale */
    const yScale = d3.scaleBand()
        .domain(data.map(d => d.hts)) 
        .range([0, height])
        .padding(0.25);

    /* Draw Axes */
    /* X Axis */
    const xAxis = d3.axisBottom(xScale).ticks(5);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);
    
    /* X Axis Title */
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Absolute Increase (USD Millions)");

    /* Y Axis */
    const yAxis = d3.axisLeft(yScale);
    svg.append("g")
        .call(yAxis);

    /* Draw the bars */
    svg.selectAll(".bar")
        .data(data)
        .join("rect")
          .attr("class", "bar")
          .attr("x", 0)
          .attr("y", d => yScale(d.hts)) 
          .attr("width", d => xScale(d.absChange))
          .attr("height", yScale.bandwidth())
          .attr("fill", color);
          
    /* Draw the value labels on the bars */
    svg.selectAll(".label")
        .data(data)
        .join("text")
          .attr("class", "label")
          .attr("x", d => xScale(d.absChange) + 5)
          .attr("y", d => yScale(d.hts) + yScale.bandwidth() / 2)
          .attr("dy", "0.35em")
          .style("font-size", "12px")
          .text(d => d.absChange.toFixed(1));
}

/* Draw the two charts */
createHorizontalBarChart("#chart-china", chinaTopProducts, "#D55E00", maxAbsChange + 10);
createHorizontalBarChart("#chart-feyes", feyesTopProducts, "#0072B2", maxAbsChange + 10);