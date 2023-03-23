import * as d3 from 'd3';
import letterAspectRatio from "./letterAspectRatio";

const getWordWidth = (word, fontSize = 14) => word.split('').reduce((acc, cur) => {
  return acc + letterAspectRatio[cur] * fontSize
}, 0);

const getOffsetX = (name) => {
  return getWordWidth(name) + 20
}

const getAxis = (centerX, centerY, centerZ, distance) => {
  // 当前处于第一、四象限
  if (centerY <= 0) {
    const cos = Math.abs(centerX / centerZ)
    const sin = Math.abs(centerY / centerZ)
    const x = centerX >= 0 ? cos * distance : -cos * distance
    const y = -sin * distance
    return [x, y]
  }
  // 当前处于第二、三象限
  const cos = Math.abs(centerY / centerZ)
  const sin = Math.abs(centerX / centerZ)
  const x = centerX > 0 ? sin * distance : -sin * distance
  const y = cos * distance
  return [x, y]
}

const animatePolyline = (d, i, options) => {
  const {datasets, points, arc, distance} = options
  const centerX = arc.centroid(d)[0]
  const centerY = arc.centroid(d)[1]
  const centerZ = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))
  const offsetX = getOffsetX(datasets[i].name)
  const [X, Y] = getAxis(centerX, centerY, centerZ, distance)
  points.push({[datasets[i].name]: [X, Y]})
  if (centerX >= 0) {
    return t => {
      const x = centerX + (X - centerX) * t
      const y = centerY + (Y - centerY) * t
      return `${centerX},${centerY} ${x},${y}, ${x + offsetX},${y}`
    }
  }
  return t => {
    const x = centerX + (X - centerX) * t
    const y = centerY + (Y - centerY) * t
    return `${centerX},${centerY} ${x},${y}, ${x - offsetX},${y}`
  }
}

const animateText = (selection, options) => {
  const {datasets, points, offsetY} = options
  selection
    .attrTween('x', (_d, i) => {
      const {name} = datasets[i]
      const [x] = points[i][name]
      const offsetX = getOffsetX(name)
      if (x > 0) {
        return t => (x + 5) * t
      }
      return t => (x - offsetX + 5) * t
    })
    .attrTween('y', (_d, i) => {
      const {name} = datasets[i]
      const [, y] = points[i][name]
      return t => (y - offsetY) * t
    })
}

const animatePercentage = (selection, options) => {
  const {datasets, points, r1} = options
  selection
    .attrTween('x', (d, i) => {
      const {name} = datasets[i]
      const [x] = points[i][name]
      const offsetX = getOffsetX(name)
      if (x > 0) {
        return t => x + offsetX + r1 - 10
      }
      return t => x - offsetX - r1 - 10
    })
    .attrTween('y', (d, i) => {
      const {name} = datasets[i]
      const [, y] = points[i][name]
      return t => y + 4
    })
}

const animateCircle = (selection, options) => {
  const {datasets, points, r1} = options
  selection
    .attrTween('cx', (d, i) => {
      const {name} = datasets[i]
      const [x] = points[i][name]
      const offsetX = getOffsetX(name)
      if (x > 0) {
        return t => x + offsetX + r1
      }
      return t => x - offsetX - r1
    })
    .attrTween('cy', (d, i) => {
      const {name} = datasets[i]
      const [, y] = points[i][name]
      return t => y
    })
}

(() => {

  const generatePolyline = selection => {
    // 生成折线
    selection.append('polyline')
      .attr('class', 'polyline')
      .transition()
      .duration(1000)
      .attrTween('points', (d, i) => animatePolyline(d, i, {arc, datasets, points, distance}))
      .attr('stroke', '#6F68A7')
      .attr('fill', 'none')
  };

  const generateText = (selection) => {
    // 添加文字
    selection.append('text')
      .attr('class', 'text')
      .style('font-size', '14px')
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .call(selection => animateText(selection, {datasets, points, offsetY}))
      .style('opacity', 1)
      .attr('fill', '#6F68A7')
      .text((d, i) => datasets[i].name)
  }

  const generatePercentage = (selection) => {
    // 添加百分比
    selection.append('text')
      .attr('class', 'text')
      .attr('fill', '#6F68A7')
      .style('font-size', '12px')
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .call(selection => animatePercentage(selection, {datasets, points, r1}))
      .style('opacity', 1)
      .text((d, i) => {
        const sum = datasets.reduce((acc, cur) => acc + cur.value, 0)
        return `${datasets[i].value / sum * 100}%`
      })
  }

  const generateCircle = (selection) => {
    // 添加圆点
    selection.append('circle')
      .attr('class', 'circle')
      .transition()
      .duration(1000)
      .call(selection => animateCircle(selection, {datasets, points, r1}))
      .attr('r', r1)
      .attr('fill', 'none')
      .attr('stroke', '#6F68A7')
  }

  const generateArcs = (selection) => {
    selection
      .selectAll('path')
      .data(arcs)
      .enter()
      .append('g')
      .attr('class', 'path-group')
      .append('path')
      .transition()
      .duration(1000)
      .attr('d', arc)
      .attr('fill', (d, i) => d3.schemePaired[i])
      .attrTween('d', (d, i) => {
        const interpolate = d3.interpolate(d.startAngle, d.endAngle)
        return t => {
          d.endAngle = interpolate(t)
          return arc(d)
        }
      })
  }

  const datasets = [
    {name: 'cat', value: 100},
    {name: 'dog', value: 100},
    {name: 'pig', value: 100},
    {name: 'cow', value: 100},
    {name: 'bird', value: 100},
    {name: 'fish', value: 100},
    {name: 'snake', value: 100},
    {name: 'mouse', value: 100},
    {name: 'monkey', value: 100},
    {name: 'elephant', value: 100},
  ]
  const width = 600
  const height = 600
  const r = 100;
  const r1 = 20
  const points = []
  const offsetY = 10;
  const distance = r + 50;

  const svg = d3.select('#pie')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'svg')
    .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`)
  const arcs = d3.pie()(datasets.map(data => data.value))
  const arc = d3.arc()
    .outerRadius(r)
    .innerRadius(0)

  svg.append('g')
    .attr('class', 'path-groups')
    .call(generateArcs)

  svg.selectAll('.path-group')
    .call(generatePolyline)
    .call(generateText)
    .call(generatePercentage)
    .call(generateCircle)

})()