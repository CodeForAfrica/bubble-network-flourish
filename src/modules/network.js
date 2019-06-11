import { numberWithCommas }             from '../utils/helpers'
import { state, layout }                        from '../index.js'

class Network {
    constructor() {
        this.$network = $('.network')
        this.$key = $('<div class="network__key"></div>').appendTo('.network')
        this.$keyItems = null
        this.$instructions = $(`<div class="network__instruction">` + state.instruction || '' + `</div>`).appendTo('.network')
        this.$active = $('<div class="network__active"></div>').appendTo('.network')
        this.$container = $('<div class="network__container"></div>').appendTo('.network')
        this.$entryContainer = null
        this.$entries = null
        this.$circles = null
        this.$canvas = null
        this.$activeName = null
        this.$activeTotal = null
        this.$activeClose = null
        this.useSvg = false
        this.maxTotal = 0
        this.maxValue = 0
        this.entryWidth = 0
        this.entryHeight = 0
        this.linesArray = []
        this.colorLines = null
        this.colorLinesHover = null
        this.width = layout.getPrimaryWidth()
        this.height = this.$container.outerHeight()
        this.$window = $(window)
        this.colors = Object.values(state.key_colors)
        this.colorsHover = Object.values(state.key_colors_selected)
        this.background = null
        this.data = null
    }


    init() {
        this.addMarkup()
        this.addEntries()
        this.calculateSizes()
        this.setupKey()
    }

    setupKey() {
        this.colors = Object.values(state.key_colors)
        this.$keyItems.on('mouseenter', (e) => {
            const $item = $(e.currentTarget)
            if (!$item.hasClass('active')) {
                $item.css({
                    'background': this.colors[$item.index()],
                    'color': '#FFFFFF'
                })

                $item.find('.network__key-circle').css('background', '#FFFFFF')
            }
        })

        this.$keyItems.on('mouseleave', (e) => {
            const $item = $(e.currentTarget)
            if (!$item.hasClass('active')) {
                $item.removeAttr('style')
                $item.css('border-color', this.colors[$item.index()])
                $item.find('.network__key-circle').css('background', this.colors[$item.index()])
            }
        })

        this.$keyItems.on('click', this.switchKey.bind(this))
    }

    addMarkup() {
        const keys = 2
        var titles = Object.values(state.key_labels)

        this.colors = Object.values(state.key_colors)
        this.colorsHover = Object.values(state.key_colors_selected) //this.$network.data('keyColorsSelected') || ['#0c2e6d','#901772']

        this.useSvg = this.$network.data('svg') ? this.$network.data('svg') : false

        this.colorLines = state.line_color
        this.colorLinesHover = state.line_color_selected

        this.$active.append('<div class="network__active__wrapper"></div>')
        this.$activeName = $('<span class="network__active__name"></span>').appendTo('.network__active__wrapper')
        this.$activeClose = $('<span class="network__active__close"></span>').appendTo('.network__active__wrapper')
        this.$activeTotal = $(`<span class="network__active__total" style="color: ${this.colors[0]}"></span>`).appendTo('.network__active__wrapper')

        const $legend = $('<div class="network__legend"></div>').appendTo('.network__active')

        for (let i = 0; i < keys; i++) {
            this.colors = Object.values(state.key_colors)
            let active = ''
            let style = `border-color: ${this.colors[i]};`
            let circleStyle = `background: ${this.colors[i]};`
            if (i === 0) {
                active = 'active'
                style = `background: ${this.colors[i]}; color: #FFFFFF;`
                circleStyle = 'background: #FFFFFF;'
            }
            this.$key.append(`<a class="network__key-item ${active}" style="${style}"><span class="network__key-circle" style="${circleStyle}"></span><span class="network__key-text">${titles[i]}</span></a>`)
            $legend.append(`<span class="network__legend-item"><span class="network__legend-circle" style="background: ${this.colors[i]}"></span><span class="network__key-text">${titles[i]}</span></span>`)
        }
        this.$keyItems = $('.network__key-item')

        if (this.useSvg === true) {
            this.$container.append('<svg class="network__svg"></svg>')
        } else {
            this.$canvas = $('<div class="network__canvas-container"></div>').appendTo('.network__container')
        }

        this.$entryContainer = $('<div class="network__entries"></div>').appendTo('.network__container')
    }

    addEntries() {
        $.each(this.data, (index, entry) => {
            const $entryDiv = $(`<div><span class="network__name">${entry.name}</span><span class="network__count"></span><span class="network__sending" style="background: ${this.colors[0]}"></span></div>`)
            $entryDiv.addClass('network__entry')
            $entryDiv.attr('id', 'entry-' + entry.id)
            $entryDiv.attr('data-total-sent', entry.total_sent)
            $entryDiv.attr('data-total-received', entry.total_received)
            $entryDiv.attr('data-id', entry.id)
            $entryDiv.attr('data-name', entry.name)
            $entryDiv.attr('data-sending-entry-count', entry.from.length)
            $entryDiv.attr('data-receiving-entry-count', entry.to.length)
            $entryDiv.attr('data-receiving', () => {
                let receivingArray = []
                $.each(entry.to, (index, toEntry) => {
                    receivingArray.push(toEntry.id)
                })
                return receivingArray
            })
            $entryDiv.attr('data-receiving-values', () => {
                let toArray = []
                $.each(entry.to, (index, toEntry) => {
                    toArray.push(toEntry.value)
                    this.maxValue = toEntry.value > this.maxValue ? toEntry.value : this.maxValue

                    if ($.grep(this.linesArray, (e) => {
                        return e.from === toEntry.id && e.to === entry.id
                    }).length <= 0) {
                        let bilateral = $.grep(entry.from, (e) => {
                            return e.id === toEntry.id
                        }).length > 0
                        this.linesArray.push({
                            'from': entry.id,
                            'to': toEntry.id,
                            'bilateral': bilateral,
                            'status': 'neutral'
                        })
                    }
                })
                return toArray
            })
            $entryDiv.attr('data-sending', () => {
                let fromArray = []
                $.each(entry.from, (index, fromEntry) => {
                    fromArray.push(fromEntry.id)
                })
                return fromArray
            })
            $entryDiv.attr('data-sending-values', () => {
                let fromArray = []
                $.each(entry.from, (index, fromEntry) => {
                    fromArray.push(fromEntry.value)
                    this.maxValue = fromEntry.value > this.maxValue ? fromEntry.value : this.maxValue
                })
                return fromArray
            })

            this.maxTotal = entry.total_sent > this.maxTotal ? entry.total_sent : this.maxTotal
            this.maxTotal = entry.total_received > this.maxTotal ? entry.total_received : this.maxTotal

            this.$entryContainer.append($entryDiv)
        })

        this.$entries = $('.network__entry')
        this.$circles = $('.network__sending')
    }

    calculateSizes() {
        this.entryWidth = this.$entries.first().outerWidth()
        this.entryHeight = this.$entries.first().outerHeight()

        $.each(this.data, (index, entry) => {
            const $entry = $(`#entry-${entry.id}`)
            const sendingWidth = this.entryWidth * Math.sqrt($entry.data('totalSent') / this.maxTotal)
            $entry.find('.network__sending').css({
                'width': sendingWidth,
                'height': sendingWidth
            })
        })

        this.height = this.$container.outerHeight()
    }

    click() {
        this.$entries.off('mouseenter')
        this.$entries.off('mouseleave')
        this.$entries.off('click.select')

        this.colors = Object.values(state.key_colors)

        let main_bubble_text = state.main_bubble_text
        let text_after_total = Object.values(state.text_after_total)

        const $activeCountry = $(`#entry-${state.selected_id}`)
        const modeString = state.mode === 0 ? 'receiving' : 'sending'
        const linkedIds = $activeCountry.data(modeString).toString().split(',');
        const linkedValues = $activeCountry.data(`${modeString}Values`).toString().split(',')

        var selected_entry = $("#" + state.selected_entry);

        this.$activeName.text(selected_entry.data('name'))
        if (state.mode === 0) {
            let activeTotalText = `${numberWithCommas(selected_entry.data('totalSent'))} `
            activeTotalText += selected_entry.data('totalSent') > 1 ? text_after_total[0] : this.$network.data('textAfterTotalSingular')[0]
            activeTotalText += linkedIds.length > 1 ? ` ${linkedIds.length} ${main_bubble_text.many}` : ` ${linkedIds.length} ${main_bubble_text.one}`
            this.$activeTotal.text(activeTotalText)
        } else {
            let activeTotalText = `${numberWithCommas(selected_entry.data('totalReceived'))} `
            activeTotalText += selected_entry.data('totalSent') > 1 ? text_after_total[1] : this.$network.data('textAfterTotalSingular')[1]
            activeTotalText += linkedIds.length > 1 ? ` ${linkedIds.length} ${main_bubble_text.many}` : ` ${linkedIds.length}  ${main_bubble_text.one}`
            this.$activeTotal.text(activeTotalText)
        }
        this.$active.removeClass('hide').removeClass('linked').addClass('active')
        this.$instructions.addClass('hide')
        this.$key.addClass('hide')

        this.$entries.removeClass('hide').removeClass('linked');
        this.$entries.not(`#entry-${state.selected_id}`).addClass('hide')
            .find('.network__sending, .network__receiving').css({
                'width': 0,
                'height': 0
            })

        var circleWidth = this.entryWidth * Math.sqrt($activeCountry.data(state.mode === 0 ? 'totalSent' : 'totalReceived') / this.maxTotal);
        $activeCountry.find('.network__sending, .network__receiving').css({
            'width': circleWidth,
            'height': circleWidth,
            'background': this.colors[state.mode]
        })

        $.each(linkedIds, (index, entryId) => {
            const $linkedCountry = $(`#entry-${entryId}`)
            $linkedCountry.addClass('linked').removeClass('hide')
            $linkedCountry.find('.network__count').text(`${linkedValues[index]}`)
            const linkedWidth = this.entryWidth * Math.sqrt(linkedValues[index] / this.maxTotal)
            $linkedCountry.find('.network__sending, .network__receiving').css({
                'width': linkedWidth,
                'height': linkedWidth,
                'background': this.colors[1 - state.mode]
            })
        })
    }

    deselect() {
        this.$entries.off('mouseenter')
        this.$entries.off('mouseleave')
        this.$entries.off('click.select')
        this.$entries.off('click.deselect')

        $('.network__entry.hide').off('click.deselect')
        this.$active.removeClass('active')
        this.$entries.removeClass('hide linked active')
        this.$instructions.removeClass('hide')
        this.$key.removeClass('hide')

        this.$circles.each((index, element) => {
            const $circle = $(element)
            const $entry = $circle.parents('.network__entry')
            let circleWidth = this.entryWidth * Math.sqrt($entry.data('totalReceived') / this.maxTotal)
            if (state.mode === 0) {
                circleWidth = this.entryWidth * Math.sqrt($entry.data('totalSent') / this.maxTotal)
            }
            $circle.css({
                'width': circleWidth,
                'height': circleWidth,
                'background': this.colors[state.mode]
            })
        })
    }

    switchKey(e) {
        const $TARGET = $(e.currentTarget)
        this.colors = Object.values(state.key_colors)
        if ($TARGET.hasClass('active')) {
            return
        }

        const $active = $TARGET.siblings('.active')
        $active.removeAttr('style')
        $active.css('border-color', this.colors[$active.index()])
        $active.find('.network__key-circle').css('background', this.colors[$active.index()])
        $TARGET.addClass('active').siblings().removeClass('active')
        $TARGET.css({
            'background': this.colors[$TARGET.index()],
            'color': '#FFFFFF'
        })
        $TARGET.find('.network__key-circle').css('background', '#FFFFFF')

        this.switchMode()
    }

    resize() {
        this.entryWidth = this.$entries.first().outerWidth()
        this.entryHeight = this.$entries.first().outerHeight()

        this.width = layout.getPrimaryWidth()
        this.height = this.$container.outerHeight()

        const $activeCountry = $('.network__entry.active')
        let receivingIds = null
        let receivingValues = null
        if ($activeCountry.length > 0) {
            receivingIds = $('.network__entry.active').data('receiving').toString().split(',')
            receivingValues = $('.network__entry.active').data('receivingValues').toString().split(',')
        }

        $('.network__sending').each((index, element) => {
            const $circle = $(element)
            const $entry = $circle.parents('.network__entry')
            if ($entry.hasClass('linked')) {
                const rIndex = receivingIds.indexOf($entry.data('id'))
                const receivingWidth = this.entryWidth * Math.sqrt(receivingValues[rIndex] / this.maxTotal)
                $entry.find('.network__sending, .network__receiving').css({
                    'width': receivingWidth,
                    'height': receivingWidth
                })
            } else if (!$entry.hasClass('hide')) {
                const sendingWidth = this.entryWidth * Math.sqrt($entry.data('totalSent') / this.maxTotal)
                $entry.find('.network__sending, .network__receiving').css({
                    'width': sendingWidth,
                    'height': sendingWidth
                })
            }
        })
    }

    switchMode() {
        this.colors = Object.values(state.key_colors)

        if (state.mode === 0) {
            this.$activeTotal.css('color', this.colors[1])
            this.$circles.removeClass('network__sending').addClass('network__receiving')
            this.$circles.each((index, element) => {
                const $circle = $(element)
                const $entry = $circle.parents('.network__entry')
                const receivingWidth = this.entryWidth * Math.sqrt($entry.data('totalReceived') / this.maxTotal)
                $circle.css({
                    'width': receivingWidth,
                    'height': receivingWidth,
                    'background': this.colors[1 - state.mode]
                })
            })
        } else {
            this.$activeTotal.css('color', this.colors[0])
            this.$circles.addClass('network__sending').removeClass('network__receiving')
            this.$circles.each((index, element) => {
                const $circle = $(element)
                const $entry = $circle.parents('.network__entry')
                const sendingWidth = this.entryWidth * Math.sqrt($entry.data('totalSent') / this.maxTotal)
                $circle.css({
                    'width': sendingWidth,
                    'height': sendingWidth,
                    'background': this.colors[1 - state.mode]
                })
            })
        }

        state.mode = 1 - state.mode
    }
}

export default Network
