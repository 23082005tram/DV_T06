// Q13.js - Small multiples 3 cột, full screen, có label cho từng bar

const width = window.innerWidth,
      height = window.innerHeight,
      margin = { top: 40, right: 20, bottom: 40, left: 20 };

const facetPaddingX = 60;
const facetPaddingY = 80;

const svg = d3.select("#Q9")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("font-size", "13px")
  .style("border-radius", "6px")
  .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
  .style("pointer-events", "none")
  .style("opacity", 0);

d3.csv("ggdata.csv").then(data => {
  // Gom dữ liệu theo nhóm
  const nested = d3.rollups(
    data,
    v => {
      const totalOrders = new Set(v.map(d => d["Mã đơn hàng"])).size;
      return d3.rollups(
        v,
        vv => new Set(vv.map(d => d["Mã đơn hàng"])).size,
        d => "[" + d["Mã mặt hàng"] + "] " + d["Tên mặt hàng"]
      )
      .map(([mh, count]) => ({ mathang: mh, prob: count / totalOrders }))
      .sort((a, b) => d3.descending(a.prob, b.prob));
    },
    d => "[" + d["Mã nhóm hàng"] + "] " + d["Tên nhóm hàng"]
  );

  const flat = nested.flatMap(([nhom, items]) =>
    items.map(d => ({ nhom, ...d }))
  );
  const groups = Array.from(new Set(flat.map(d => d.nhom)));

  // Layout 3 cột
  const cols = 3, rows = Math.ceil(groups.length / cols);
  const facetW = (width - margin.left - margin.right - (cols - 1) * facetPaddingX) / cols;
  const facetH = (height - margin.top - margin.bottom - (rows - 1) * facetPaddingY) / rows;

  // Thu nhỏ vùng vẽ bar bên trong mỗi facet
  const innerMargin = { top: 30, right: 40, bottom: 40, left: 120 };
  const innerW = facetW - innerMargin.left - innerMargin.right;
  const innerH = facetH - innerMargin.top - innerMargin.bottom;

  // Thang màu
  const allColors = d3.schemeTableau10.concat(d3.schemeSet3, d3.schemePaired);

  groups.forEach((nhom, i) => {
    const gData = flat.filter(d => d.nhom === nhom);

    const col = i % cols;
    const row = Math.floor(i / cols);

    const gx = margin.left + col * (facetW + facetPaddingX);
    const gy = margin.top + row * (facetH + facetPaddingY);

    // G container cho facet
    const g = svg.append("g")
      .attr("transform", `translate(${gx},${gy})`);

    // G bên trong để chừa margin cho trục
    const inner = g.append("g")
      .attr("transform", `translate(${innerMargin.left},${innerMargin.top})`);

    // max của nhóm
    const maxProb = d3.max(gData, d => d.prob);
    const maxRounded = Math.ceil(maxProb * 10) / 10; // làm tròn lên bậc 10%

    const x = d3.scaleLinear()
      .domain([0, maxRounded])
      .range([0, innerW]);

    const y = d3.scaleBand()
      .domain(gData.map(d => d.mathang))
      .range([0, innerH])
      .padding(0.2);

    const color = d3.scaleOrdinal()
      .domain(gData.map(d => d.mathang))
      .range(allColors);

    // Bars
    inner.selectAll("rect")
      .data(gData)
      .join("rect")
      .attr("x", 0)
      .attr("y", d => y(d.mathang))
      .attr("width", d => x(d.prob))
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.mathang))
      .on("mouseover", (e, d) => {
        tooltip.transition().style("opacity", 1);
        tooltip.html(`<b>${d.mathang}</b><br>Xác suất: ${(d.prob*100).toFixed(1)}%`);
      })
      .on("mousemove", e => {
        tooltip.style("left", (e.pageX + 12) + "px")
               .style("top", (e.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().style("opacity", 0));

    // Labels cho bar
    inner.selectAll("text.label")
      .data(gData)
      .join("text")
      .attr("class", "label")
      .attr("x", d => x(d.prob) + 5) // đặt ngoài bar, cách 5px
      .attr("y", d => y(d.mathang) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", "11px")
      .attr("fill", "#000")
      .text(d => (d.prob * 100).toFixed(1) + "%");

    // Trục X (bước nhảy 20%, dừng ở maxRounded)
    inner.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3.axisBottom(x)
          .tickValues(d3.range(0, maxRounded + 0.001, 0.2))
          .tickFormat(d3.format(".0%"))
      );

    // Trục Y
    inner.append("g").call(d3.axisLeft(y).tickSize(0));

    // Title nhóm
    g.append("text")
      .attr("x", facetW / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "15px")
      .text(nhom);
  });
});
