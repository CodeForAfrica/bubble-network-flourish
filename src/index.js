import initLayout                       from "@flourish/layout";

import NetworkCanvas                    from './modules/network-canvas'
import Network                          from './modules/network'
import {sortData}                       from './utils/helpers'

export var data = {};
var bubbles;
var $network_container;
var networkCanvas;
var previously_selected;

export var state = {
  // The current state of template. You can make some or all of the properties
  // of the state object available to the user as settings in settings.js.
  mode: 0,
  key_labels: { label_1: 'Sending', label_2: 'Receiving'},
  instruction: "Click on a country to see migration flow",

  main_bubble_text: { many: 'countries', one: 'country'},
  text_after_total: {  tat_1: 'transactions sent to', tat_2: 'transactions received from'},
  text_after_total_singular: {  tats_1: 'transaction to', tats_2: 'transaction from'},
  source: { label: 'Code for Africa', url: 'http://codeforafrica.org' },

  key_colors:          { color_1: '#2353aa', color_2: '#ae7ea2' },
  key_colors_selected: { color_1: '#0c2e6d', color_2: '#901772' },
  line_color:          "#cccccc",
  line_color_selected: "#888888",
  layout: {},

  selected_entry: null,
  selected_id: null
};

export var layout = initLayout(state.layout);

function setDetailText(){
  if($('.network__entry.active').length > 0){
    const $activeCountry = $('.network__entry.active');
    const modeString = state.mode === 0 ? 'receiving' : 'sending'
    const linkedIds = $activeCountry.data(modeString).toString().split(',')
    const linkedValues = $activeCountry.data(`${modeString}Values`).toString().split(',')

    if( state.mode === 0){
      let activeTotalText = `${$activeCountry.data('totalSent')} `
      activeTotalText +=  $activeCountry.data('totalSent') > 1 ? state.text_after_total.tat_1 : state.text_after_total_singular.tats_1;
      activeTotalText += linkedIds.length > 1 ? ` ${linkedIds.length} ${state.main_bubble_text.many}` : ` ${linkedIds.length} ${state.main_bubble_text.one}`
      $('.network__active__total').text(activeTotalText)

    } else {
      let activeTotalText = `${$activeCountry.data('totalReceived')} `
      activeTotalText +=  $activeCountry.data('totalReceived') > 1 ? state.text_after_total.tat_2 : state.text_after_total_singular.tats_2;
      activeTotalText += linkedIds.length > 1 ? ` ${linkedIds.length} ${state.main_bubble_text.many}` : ` ${linkedIds.length} ${state.main_bubble_text.one}`
      $('.network__active__total').text(activeTotalText)
    }


  }
}

function setSource(){
  if(state.source.label.length > 0){
    $('.network__source').empty()
    if(state.source.url.length > 0){
      $('.network__source').append('<a href="' + state.source.url + '">' + state.source.label + '</a>')
    }
    else {
      $('.network__source').text(state.source.label)
    }
  }
}

export function update() {
  if (!data.bubbles.processed) { // If data has changed, draw the canvas again
    draw();
    return;
  }
  
  layout.update();

  $('#network').css('background', state.color_background)
  $('.network__key-text:eq(0)').text(state.key_labels.label_1)
  $('.network__key-text:eq(1)').text(state.key_labels.label_2)

  $('.network__key-item:eq(0)').css( {'border-color': state.key_colors.color_1, 'color': state.key_colors.color_1 })
  $('.network__key-item:eq(0) > .network__key-circle').css('background',function() {
    return this.parentElement.className.indexOf("active") ? null : state.key_colors.color_1
  })
  $('.network__key-item:eq(0).active').css( {'background': state.key_colors.color_1, 'color': '#FFFFFF' })

  $('.network__key-item:eq(1)').css( {'border-color': state.key_colors.color_2, 'color': state.key_colors.color_2 })
  $('.network__key-item:eq(1) > .network__key-circle').css('background', function() {
    return this.parentElement.className.indexOf("active") ? null : state.key_colors.color_2
  })
  $('.network__key-item:eq(1).active').css( {'background': state.key_colors.color_2, 'color': '#FFFFFF' })

  $('.network__legend-circle:eq(0)').css('background', state.key_colors.color_1)
  $('.network__legend-circle:eq(1)').css('background', state.key_colors.color_2)

  $('.network__instruction').text(state.instruction)

  $('.network__sending').css('background', state.key_colors.color_1)
  $('.network__receiving').css('background', state.key_colors.color_2)

  $('.network__sending:hover').css('background', state.key_colors_selected.color_1)
  $('.network__receiving:hover').css('background', state.key_colors_selected.color_2)

  setDetailText()
  setSource();

  if (state.selected_id != null) networkCanvas.select();
  else if (state.selected_id == null && previously_selected != null) networkCanvas.deselect();

  previously_selected = state.selected_id;

  layout.setHeight($network_container.height())
}

export function draw() {
  $network_container = $('<div class="network-container">')
  var $network = $('<div class="network" id="network">');
  $network.attr('data-key-titles', '["Sending","Receiving"]')
  $network.attr('data-text-before-total', '["Sends","Receives"]')
  $network.attr('data-text-after-total', '["transactions to", "transactions from"]')
  $network.attr('data-text-after-total-singular', '["transaction to", "transaction from"]')
  $network.attr('data-node-type-text', 'countries')
  $network.attr('data-node-type-text-singular', 'country')
  $network.attr('data-svg', 'false')
  $network.attr('data-key-colors', '["#2353aa","#ae7ea2"]')
  $network.attr('data-key-colors-selected', '["#0c2e6d","#901772"]')
  $network.attr('data-color-lines', "#00ffff")
  $network.attr('data-color-lines-hover', "#ff0000")
  $network.attr('data-color-background', "#EAEAEA")
  $network.attr('data-instructions', "Click on a country to see migration flow")

  var $network_source = $('<div class="network__source"></div>');

  $network_container.append($network);
  $network_container.append($network_source);

  $(layout.getSection('primary')).append($network_container);

  const sortedData = sortData(data.bubbles);

  // We add this to know that the data was processed. If a user makes a
  // change to the data in the interface, data.bubbles.processed will
  // return undefined
  data.bubbles.processed = true;

  if ($network.length > 0) {
      networkCanvas = new NetworkCanvas(sortedData)
      networkCanvas.init()
  }

  window.addEventListener("resize", update)
  update();
}
