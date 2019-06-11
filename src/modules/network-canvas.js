import * as d3                          from 'd3'
import Network                          from './network'
import { hexToRGB }                     from '../utils/helpers'
import throttle                         from '../utils/throttle'
import { state, layout, update }                from '../index.js'

class NetworkCanvas extends Network {
    constructor(data) {
        super()
        this.canvas = null
        this.customBase = null
        this.custom = null
        this.data = data
    }

    init() {
        super.init()
        this.setupCanvas()
        this.databind()
        this.draw()
        this.mouseEvents()

        throttle('resize', 'resize.network')
        this.$window.on('resize.network', () => {
            this.resize()
        })
    }

    switchMode() {
        super.switchMode()
        this.refreshCanvas()
    }

    resize() {
        super.resize()

        this.canvas.attr('width', layout.getPrimaryWidth() * 2)
            .attr('height', this.height * 2)

        this.refreshCanvas()
    }

    setupCanvas() {
        this.width = layout.getPrimaryWidth()
        this.height = this.$container.outerHeight()
        this.canvas = d3.select('.network__canvas-container')
            .append('canvas')
            .classed('network__canvas', true)
            .attr('width', layout.getPrimaryWidth() * 2)
            .attr('height', this.height * 2)
        this.customBase = document.createElement('custom')
        this.custom = d3.select(this.customBase)
    }

    databind() {
        let column_count = 100 / Math.round((this.entryWidth / this.width) * 100)
        let join = this.custom.selectAll('custom.line')
            .data(this.linesArray);

        const canvasLeft = this.$canvas.offset().left

        let enterSel = join.enter()
            .append('custom')
            .attr('class', 'line')
            .attr('id', (d) => d.from);

        join.merge(enterSel)
            .attr('x1', (d, i) => {
                let left_offset = (d.from % column_count) * this.entryWidth;
                return 2 * Math.floor(left_offset + this.entryWidth / 2) + 0.5
            })
            .attr('y1', (d) => {
                let top_offset = Math.floor(d.from / column_count) * this.entryHeight;
                return 2 * Math.floor(top_offset + 11 + this.entryHeight / 2) + 0.5
            })
            .attr('x2', (d) => {
                let left_offset = (d.to % column_count) * this.entryWidth;
                return 2 * Math.floor(left_offset + this.entryWidth / 2) + 0.5
            })
            .attr('y2', (d) => {
                let top_offset = Math.floor(d.to / column_count) * this.entryHeight;
                return 2 * Math.floor(top_offset + 11 + this.entryHeight / 2) + 0.5
            })
            .attr('stroke-width', 1)
            .attr('stroke', (d) => {
                let color = this.colorLines
                if (d.status === 'active') {
                    color = this.colorLinesHover
                    
                }

                let opacity = 1
                if (d.status === 'hidden') {
                    opacity = 0
                }

                return hexToRGB(color, opacity)
            })
    }

    draw() {
        // build context
        let context = this.canvas.node().getContext('2d')

        // clear canvas
        context.clearRect(0, 0, this.width * 2, this.height * 2)

        const elements = this.custom.selectAll('custom.line')

        elements.each(function() { // for each virtual/custom element...
            const node = d3.select(this)
            context.strokeStyle = node.attr('stroke')
            context.lineWidth = node.attr('stroke-width')
            context.beginPath()
            context.moveTo(node.attr('x1'), node.attr('y1'))
            context.lineTo(node.attr('x2'), node.attr('y2'))
            context.stroke()
        })
    }

    refreshCanvas(callback = false) {
        this.databind()

        let t = d3.timer((elapsed) => {

            this.draw()

            if (elapsed > 350) {
                t.stop()

                if (callback !== false) {
                    callback()
                }
            }
        })
    }

    mouseEnter($entry) {
        let colorsHover = Object.values(state.key_colors_selected)
        const id = $entry.data('id')
        $entry.find('.network__sending, .network__receiving').css('background', colorsHover[state.mode])

        for(let i = 0; i < this.linesArray.length; i++) {
            let entry = this.linesArray[i]
            if (state.mode === 0) {
                if (entry.from === id || (entry.to === id && entry.bilateral)) {
                    this.linesArray[i].status = 'active'
                }
                else {
                    this.linesArray[i].status = null
                }
            } else {
                if (entry.to === id || (entry.from === id && entry.bilateral)) {
                    this.linesArray[i].status = 'active'
                }
                else {
                    this.linesArray[i].status = null
                }
            }
        }

        this.refreshCanvas()
    }

    mouseLeave() {
        let colors = Object.values(state.key_colors)
        this.$circles.css('background', colors[state.mode])
        for(let i = 0; i < this.linesArray.length; i++) {
            if (this.linesArray[i].status !== 'hidden') {
                this.linesArray[i].status = 'neutral'
            }
        }

        this.refreshCanvas()
    }

    mouseEvents() {
        this.$entries.on('mouseenter', (e) => {
            this.mouseEnter($(e.currentTarget))
        })

        this.$entries.on('mouseleave', () => {
            this.mouseLeave()
        })

        this.$entries.on('click.select', (e) => {
            if (state.selected_id != null) return;
            const id = $(e.currentTarget).data('id')

            state.selected_entry = e.currentTarget.id;
            state.selected_id = id;

            update();
        })
    }

    select() {
        $("#" + state.selected_entry).addClass('active');
        super.click()

        for(let i = 0; i < this.linesArray.length; i++) {
            const d = this.linesArray[i]
            if(state.mode === 0) {
                if (d.from !== state.selected_id && (d.to !== state.selected_id || !d.bilateral)) {
                    d.status = 'hidden'
                }
                else {
                    d.status = 'active'
                }
            } else {
                if (d.to !== state.selected_id && (d.from !== state.selected_id || !d.bilateral)) {
                    this.linesArray[i].status = 'hidden'
                }
                else {
                    d.status = 'active'
                }
            }
        }

        this.refreshCanvas()

        this.$active.on('click.deselect', () => {
            state.selected_entry = null;
            state.selected_id = null;

            update();
        })

        $('.network__entry.hide').on('click.deselect', () => {
            state.selected_entry = null;
            state.selected_id = null;
            update();
        })
    }

    deselect() {
        super.deselect()

        for(let i = 0; i < this.linesArray.length; i++) {
            this.linesArray[i].status = 'neutral'
        }

        this.refreshCanvas(this.mouseEvents.bind(this))
    }
}

export default NetworkCanvas
