// Q12.js - Bar chart phân phối mức chi tiêu khách hàng (bins = 50,000)

const margin = { top: 50, right: 30, bottom: 50, left: 80 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#Q12")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// --- Tooltip ---
const tooltip = d3.select("#Q12")
  .append("div")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("border-radius", "5px")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("box-shadow", "0px 2px 6px rgba(0,0,0,0.2)")
  .style("opacity", 0);

d3.csv("ggdata.csv").then(data => {
  const spendingByCustomer = d3.rollup(
    data,
    v => d3.sum(v, d => +d["Thành tiền"]),
    d => d["Mã khách hàng"]
  );
  const spendingValues = Array.from(spendingByCustomer.values());

  const maxSpending = d3.max(spendingValues);
  const histogram = d3.histogram()
    .domain([0, maxSpending])
    .thresholds(d3.range(0, maxSpending + 50000, 50000));

  const bins = histogram(spendingValues);

  const x = d3.scaleBand()
    .domain(bins.map(d => `${d.x0} - ${d.x1}`))
    .range([0, width])
    .padding(0.2);

  const yMax = d3.max(bins, d => d.length);
  const y = d3.scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height, 0]);

  // Vẽ cột + tooltip
  svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
      .attr("x", d => x(`${d.x0} - ${d.x1}`))
      .attr("y", d => y(d.length))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.length))
      .attr("fill", "#1f77b4")
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(
            `<strong>Mức chi trả:</strong> ${d3.format(",")(d.x0)} - ${d3.format(",")(d.x1)}<br>
             <strong>Số lượng KH:</strong> ${d.length}`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
      });

  // Trục
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0).tickFormat(() => "")); // bỏ nhãn X

  svg.append("g")
    .call(
      d3.axisLeft(y)
        .tickValues(d3.range(0, yMax + 500, 500)) // bước 500
        .tickFormat(d3.format(","))               // định dạng số nguyên: 500, 1000, 1500...
    );

  // Nhãn trục Y
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px");

  // Tiêu đề
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold");
});
