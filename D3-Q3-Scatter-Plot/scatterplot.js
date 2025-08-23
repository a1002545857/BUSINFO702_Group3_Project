/* Data Setup*/
const chinaRealData = [
    { x: 7.395365, y: 44.606077 },
    { x: -1.170965, y: 24.636178 },
    { x: -2.954779, y: 11.298113 },
    { x: 0.648477, y: 8.726277 },
    { x: -1.422392, y: 1.945463 },
    { x: -2.754386, y: -4.809695 },
    { x: 2.006489, y: 6.871170 },
    { x: -0.919640, y: -8.991671 },
    { x: 6.836758, y: 3.406186 },
    { x: 9.879953, y: 1.140804 },
    { x: 4.376775, y: -5.347867 },
    { x: 1.668016, y: 5.133200 },
    { x: -4.745859, y: -1.372949 },
    { x: -5.058221, y: 4.614105 },
    { x: -6.495756, y: 4.787116 },
    { x: -6.455825, y: -8.365173 }
];

const feyesRealData = [
    { x: -2.392432, y: -1.029356 },
    { x: 1.869605, y: 54.709308 },
    { x: 0.831787, y: 12.098350 },
    { x: 1.864215, y: 16.806115 },
    { x: 2.750816, y: 15.383880 },
    { x: 2.941508, y: 22.559884 },
    { x: 4.673762, y: 23.949634 },
    { x: 3.770622, y: 11.818235 },
    { x: 0.962573, y: 8.375635 },
    { x: -1.572063, y: -3.414837 },
    { x: -3.192646, y: -4.127436 },
    { x: -2.063218, y: -3.506863 },
    { x: -0.333593, y: -1.885381 },
    { x: 0.208786, y: -0.030628 },
    { x: 0.484742, y: -0.791004 },
    { x: -0.266577, y: 1.115795 }
];

/* Statistical information for the chart */
const chinaStats = { r: 0.33, t: 1.308, df: 14 };
const feyesStats = { r: 0.6594, t: 3.281, df: 14 };


/* Linear regression calculation function */
function calculateLinearRegression(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    data.forEach(d => {
        sumX += d.x;
        sumY += d.y;
        sumXY += d.x * d.y;
        sumX2 += d.x * d.x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}


/* Reusable scatter plot drawing function */
function createScatterPlot(containerId, data, stats, title, xDomain, yDomain) {
    /* Dimension settings */
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 480 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    d3.select(containerId).html("");
    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    /* Scales */
    const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
    const yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);

    /* Axes and gridlines */
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    svg.append("g")
        .call(d3.axisLeft(yScale));
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
        .selectAll("line").style("stroke", "#e9e9e9").style("stroke-dasharray", "2 2");
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(""))
        .selectAll("line").style("stroke", "#e9e9e9").style("stroke-dasharray", "2 2");

    /* Draw data points */
    svg.selectAll(".dot")
        .data(data)
        .join("circle")
          .attr("cx", d => xScale(d.x))
          .attr("cy", d => yScale(d.y))
          .attr("r", 4)
          .style("fill", "black");

    /* Calculate and draw the regression line */
    const { slope, intercept } = calculateLinearRegression(data);
    const x1 = xDomain[0];
    const y1 = slope * x1 + intercept;
    const x2 = xDomain[1];
    const y2 = slope * x2 + intercept;

    svg.append("line")
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2))
        .style("stroke", "#0072B2")
        .style("stroke-width", 2);

    /* Add statistical information annotation */
    svg.append("text")
        .attr("x", width - 10)
        .attr("y", 10)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .text(`r = ${stats.r.toFixed(2)}, t = ${stats.t.toFixed(3)}, df = ${stats.df}`);
        
    /* Add subtitle */
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(title);
    
    /* Add axis titles */
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .text("Annual change in polluting share (percentage points)");
      
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .text("YoY total export growth (%)");
}

/* Draw the two charts */
createScatterPlot(
    "#scatter-china", 
    chinaRealData, 
    chinaStats, 
    "China", 
    [-10, 12],
    [-15, 60]
);
createScatterPlot(
    "#scatter-feyes", 
    feyesRealData, 
    feyesStats, 
    "Other Five Eyes countries", 
    [-5, 7],
    [-15, 60]
);