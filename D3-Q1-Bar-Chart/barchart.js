/* Data Setup */
const rawData = [
    { Year: 2020, DestinationGroup: 'China', TotalExports: 98.7, GreenExports: 5.4 },
    { Year: 2020, DestinationGroup: 'Other Five Eyes countries', TotalExports: 299.0, GreenExports: 14.1 },
    { Year: 2021, DestinationGroup: 'China', TotalExports: 118.7, GreenExports: 6.4 },
    { Year: 2021, DestinationGroup: 'Other Five Eyes countries', TotalExports: 352.5, GreenExports: 15.9 },
    { Year: 2022, DestinationGroup: 'China', TotalExports: 116.8, GreenExports: 5.5 },
    { Year: 2022, DestinationGroup: 'Other Five Eyes countries', TotalExports: 417.2, GreenExports: 16.6 },
    { Year: 2023, DestinationGroup: 'China', TotalExports: 118.0, GreenExports: 5.2 },
    { Year: 2023, DestinationGroup: 'Other Five Eyes countries', TotalExports: 413.4, GreenExports: 17.5 },
    { Year: 2024, DestinationGroup: 'China', TotalExports: 117.8, GreenExports: 5.1 },
    { Year: 2024, DestinationGroup: 'Other Five Eyes countries', TotalExports: 411.7, GreenExports: 17.9 }
];

/* Keys for grouping and legend */
const subgroups = ['GreenExports', 'TotalExports'];

/* Filter data for each chart */
const chinaData = rawData.filter(d => d.DestinationGroup === 'China');
const feyesData = rawData.filter(d => d.DestinationGroup === 'Other Five Eyes countries');


/* Chart Drawing Function */
function createGroupedBarChart(containerId, data, yDomainMax) {
    /* Define chart dimensions and margins */
    const margin = { top: 40, right: 20, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    /* Select SVG, clear previous content, and setup group */
    const svg = d3.select(containerId)
        .html("") /* Clear previous renders */
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    /* Get years for the x-axis */
    const groups = data.map(d => d.Year);

    /* X-axis scale for year groups */
    const x0 = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding(0.2);

    /* X-axis scale for subgroups within years */
    const x1 = d3.scaleBand()
        .domain(subgroups)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    /* Y-axis scale for export values */
    const y = d3.scaleLinear()
        .domain([0, yDomainMax])
        .range([height, 0]);

    /* Color scale for subgroups */
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#D55E00', '#0072B2']); /* Orange for Green, Blue for Total */

    /* Create a group for each year */
    const yearGroup = svg.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${x0(d.Year)}, 0)`);

    /* Draw the bars within each year's group */
    yearGroup.selectAll("rect")
        .data(d => subgroups.map(key => ({ key: key, value: d[key] })))
        .join("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.key));

    /* Add text labels on top of each bar */
    yearGroup.selectAll("text")
        .data(d => subgroups.map(key => ({ key: key, value: d[key] })))
        .join("text")
        .text(d => d.value.toFixed(1))
        .attr("x", d => x1(d.key) + x1.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5) /* Position 5px above the bar */
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#333");

    /* Add X axis at the bottom */
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0).tickSizeOuter(0));

    /* Add Y axis on the left */
    svg.append("g")
        .call(d3.axisLeft(y));

    /* Add Y axis title */
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Export Value (USD Billions)");
}


/* Render Charts */
/* Create the chart for China */
createGroupedBarChart("#chart-china", chinaData, 150);

/* Create the chart for Other Five Eyes */
createGroupedBarChart("#chart-feyes", feyesData, 450);