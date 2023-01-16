import * as d3 from 'd3';

;(() => {

    let container = null
    let bar = null
    let datasets = []
    let svg = null
    let xScale = null
    let yScale = null
    let xAxis = null
    let yAxis = null
    let marginLeft = 40
    let marginBottom = 20

    const init = () => {
      container = {
        width: 600,
        height: 600
      }
      bar = {
        width: 30,
        height: 500
      }
      // shuffle
      datasets = Array.from(
        {length: 26},
        (v, i) => ({
          name: String.fromCharCode(65 + i),
          value: Math.floor(Math.random() * (bar.height - 10)) + 10
        })
      );
      // draw svg container
      svg = d3.select('#bar')
        .append('svg')
        .style('width', container.width)
        .style('height', container.height)
        .attr('class', 'svg')
    };

    // draw axis
    const drawAxis = () => {
      // xAxis
      xScale = d3.scaleBand()
        .domain(datasets.map(d => d.name))
        .range([0, container.width - marginLeft])
        .padding(0.1)
      xAxis = d3.axisBottom(xScale)
      svg.append('g')
        .attr('transform', `translate(${marginLeft}, ${container.height - marginBottom})`)
        .attr('class', 'xAxis')
        .call(xAxis)

      // yAxis
      yScale = d3
        .scaleLinear()
        .domain([0, 500])
        .range([500, 0])
      yAxis = d3.axisLeft(yScale)
      svg.append('g')
        .attr('transform', `translate(${marginLeft}, 80)`)
        .attr('class', 'yAxis')
        .call(yAxis)
        .selectAll('g')
        .attr('opacity', 1)
        .append('line')
        .attr('x2', container.width)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
    };

    // sort bar
    const sort = (e) => {
      const type = e.target.value
      const preXScale = xScale.copy()

      if (type === 'random') {
        d3.shuffle(datasets)
      } else {
        datasets.sort((a, b) => type === 'desc' ? b.value - a.value : a.value - b.value);
      }

      // reset xScale
      const domain = datasets.map(d => d.name)
      xScale.domain(domain).range([0, container.width - marginLeft])

      svg.selectAll('.rects')
        .selectAll('rect')
        .data(datasets.map(d => d.value), function (d, i) {
          // add key in order to trigger enter and exit
          return this.tagName === 'rect' ? this.key : `${this.tagName}-${i}`
        })
        .join(
          enter => {
            return enter
              .append('rect')
              .attr('fill', 'steelblue')
              .style("mix-blend-mode", "multiply")
              .attr('y', d => bar.height - d)
              .attr('width', xScale.bandwidth())
              .attr('height', (d, i) => {
                return datasets[i].value
              })
          },
          update => update,
          exit => exit
            .attr("y", yScale(0))
            .attr("height", 0)
            .remove()
        )

      // add transition for xAxis
      svg.selectAll('.xAxis')
        .transition()
        .ease(d3.easeCubic)
        .duration(1000)
        .call(xAxis)

      // add transition for rects
      svg.selectAll('.rects')
        .selectAll('rect')
        .attr('x', (d, i) => {
          return preXScale(domain[i])
        })
        .transition()
        .delay((d, i) => i * 20)
        .duration(1000)
        .attr('x', (d, i) => xScale(domain[i]))
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', (d, i) => datasets[i].value)
    };

    const registerEvents = () => {
      d3.select('#sort').on('change', sort)
    }

    // draw rect
    const drawRect = () => {
      const domain = xScale.domain()

      svg.append('g')
        .classed('rects', true)
        .attr('transform', `translate(${marginLeft}, 80)`)
        .selectAll('rect')
        .data(datasets.map(d => d.value))
        .property('key', (d, i) => xScale(domain[i]))
        .enter()
        .append('rect')
        .attr('x', (d, i) => xScale(domain[i]))
        .attr('y', bar.height)
        .attr('width', xScale.bandwidth())
        .style("mix-blend-mode", "multiply")
        .attr('fill', 'steelblue')
        .transition()
        .delay((d, i) => i * 20)
        .ease(d3.easeCubic)
        .duration(1000)
        .attr('height', (d, i) => datasets[i].value)
        .attr('y', d => bar.height - d)

      svg.selectAll('.xAxis .tick')
        .append('text')
        .attr('class', 'rect-text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#2e6be6')
        .transition()
        .delay((d, i) => i * 20)
        .ease(d3.easeCubic)
        .duration(1000)
        .attr('y', (d, i) => -datasets[i].value - 10)
    };

    init();
    drawAxis();
    drawRect();
    registerEvents()
  }
)()
