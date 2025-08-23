
/* Data Setup */
const rawData = [
    { Year: 2020, DestinationGroup: 'China', GreenSharePercent: 5.48 },
    { Year: 2020, DestinationGroup: 'Other Five Eyes countries', GreenSharePercent: 4.71 },
    { Year: 2021, DestinationGroup: 'China', GreenSharePercent: 5.40 },
    { Year: 2021, DestinationGroup: 'Other Five Eyes countries', GreenSharePercent: 4.51 },
    { Year: 2022, DestinationGroup: 'China', GreenSharePercent: 4.69 },
    { Year: 2022, DestinationGroup: 'Other Five Eyes countries', GreenSharePercent: 3.98 },
    { Year: 2023, DestinationGroup: 'China', GreenSharePercent: 4.41 },
    { Year: 2023, DestinationGroup: 'Other Five Eyes countries', GreenSharePercent: 4.23 },
    { Year: 2024, DestinationGroup: 'China', GreenSharePercent: 4.29 },
    { Year: 2024, DestinationGroup: 'Other Five Eyes countries', GreenSharePercent: 4.34 }
];

/* Chart Drawing Setup */
/* Chart dimensions */
const margin = { top: 50, right: 60, bottom: 50, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

/* Select the SVG container */
const svg = d3.select("#line-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

/* X Scale (for Year) */
const xScale = d3.scaleLinear()
    .domain(d3.extent(rawData, d => d.Year))
    .range([0, width]);

/* Y Scale (for Percentage) */
const yDomain = d3.extent(rawData, d => d.GreenSharePercent);
const yScale = d3.scaleLinear()
    .domain([yDomain[0] - 0.5, yDomain[1] + 0.5])
    .range([height, 0]);
    
/* Color palette */
const colorScale = d3.scaleOrdinal()
    .domain(['China', 'Other Five Eyes countries'])
    .range(['#D55E00', '#0072B2']);

/* Group data for line generator */
const groupedData = d3.group(rawData, d => d.DestinationGroup);

/* Line Generator */
const lineGenerator = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.GreenSharePercent));

/* Draw the lines */
svg.selectAll(".line")
    .data(groupedData)
    .join("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", d => colorScale(d[0]))
      .attr("stroke-width", 2.5)
      .attr("d", d => lineGenerator(d[1]));

/* Draw the points (circles) */
svg.selectAll(".dot")
    .data(rawData)
    .join("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.Year))
      .attr("cy", d => yScale(d.GreenSharePercent))
      .attr("r", 5)
      .attr("fill", d => colorScale(d.DestinationGroup));

/* Add labels on top of points */
svg.selectAll(".label")
    .data(rawData)
    .join("text")
      .attr("class", "label")
      .attr("x", d => xScale(d.Year))
      .attr("y", d => yScale(d.GreenSharePercent) - 12) /* Position 12px above the point */
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#333")
      .text(d => `${d.GreenSharePercent.toFixed(2)}%`);

/* Add X axis */
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

/* Add Y axis */
const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d.toFixed(1)}%`);
svg.append("g")
    .call(yAxis);

/* Add Y axis label */
svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left + 20)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Percent (%)");