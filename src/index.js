import initLayout                       from "@flourish/layout";

import NetworkCanvas                    from './modules/network-canvas'
import Network                          from './modules/network'
import {sortData}                       from './utils/helpers'

export var data = {};
var bubbles;
var $network_container;
var networkCanvas;
var previously_selected, previous_line_color, previous_line_color_selected;

export var state = {
  // The current state of template. You can make some or all of the properties
  // of the state object available to the user as settings in settings.js.
  mode: 0,
  key_labels: { label_1: 'Sending', label_2: 'Receiving'},
  instruction: "Click on a country to see migration flow",

  main_bubble_text: { many: 'countries', one: 'country'},
  text_after_total: {  tat_1: 'transactions sent to', tat_2: 'transactions received from'},
  text_after_total_singular: {  tats_1: 'transaction to', tats_2: 'transaction from'},

  key_colors:          { color_1: '#2353aa', color_2: '#ae7ea2' },
  key_colors_selected: { color_1: '#0c2e6d', color_2: '#901772' },
  line_color:          "#cccccc",
  line_color_selected: "#888888",
  layout: {
    source_name: "Code for Africa",
    source_url: "http://codeforafrica.org"
  },

  selected_entry: null,
  selected_id: null,
  selected_key: "sending"
};

export var layout = initLayout(state.layout);

function setDetailText(){
  if($('.network__entry.active').length > 0){
    const $activeCountry = $('.network__entry.active');
    const modeString = state.mode === 0 ? 'receiving' : 'sending'
    const linkedIds = $activeCountry.data(modeString).toString() != "" ? $activeCountry.data(modeString).toString().split(',') : []
    const linkedValues = $activeCountry.data(modeString).toString() != "" ? $activeCountry.data(`${modeString}Values`).toString().split(',') : []

    if( state.mode === 0){
      let activeTotalText = `${$activeCountry.data('totalSent')} `
      activeTotalText +=  $activeCountry.data('totalSent') > 1 || $activeCountry.data('totalSent') === 0 ? state.text_after_total.tat_1 : state.text_after_total_singular.tats_1;
      activeTotalText += linkedIds.length > 1 || linkedIds.length === 0 ? ` ${linkedIds.length} ${state.main_bubble_text.many}` : ` ${linkedIds.length} ${state.main_bubble_text.one}`
      $('.network__active__total').text(activeTotalText)

    } else {
      let activeTotalText = `${$activeCountry.data('totalReceived')} `
      activeTotalText +=  $activeCountry.data('totalReceived') > 1 || $activeCountry.data('totalReceived') === 0 ? state.text_after_total.tat_2 : state.text_after_total_singular.tats_2;
      activeTotalText += linkedIds.length > 1 || linkedIds.length === 0 ? ` ${linkedIds.length} ${state.main_bubble_text.many}` : ` ${linkedIds.length} ${state.main_bubble_text.one}`
      $('.network__active__total').text(activeTotalText)
    }
  }
}

export function update() {
  if (!data.bubbles.processed) { // If data has changed, draw the canvas again
    draw();
    return;
  }
  
  layout.update();

  if (state.selected_id != null) networkCanvas.select();
  else if (state.selected_id == null && previously_selected != null) networkCanvas.deselect();

  updateButtons();
  setDetailText()

  $('.network__sending').css('background', !state.selected_entry ? state.key_colors.color_1 : state.key_colors.color_2)
  $('.network__receiving').css('background', !state.selected_entry ? state.key_colors.color_2 : state.key_colors.color_1)
  
  $('.network__sending:hover').css('background', state.selected_entry ? state.key_colors_selected.color_2 : state.key_colors_selected.color_1)
  $('.network__receiving:hover').css('background', state.selected_entry ? state.key_colors_selected.color_1 : state.key_colors_selected.color_2)

  $('.active .network__sending').css('background', state.key_colors.color_1)
  $('.active .network__receiving').css('background', state.key_colors.color_2)

  if (previous_line_color != state.line_color || previous_line_color_selected != state.line_color_selected) networkCanvas.refreshCanvas();

  previously_selected = state.selected_id;
  previous_line_color = state.line_color;
  previous_line_color_selected = state.line_color_selected;

  layout.setHeight($network_container.height())
}

function updateButtons() {
  var $btn_sending = $('.network__key-item.sending');
  var $btn_receiving = $('.network__key-item.receiving');

  $btn_sending.css({
    'border-color': state.key_colors.color_1,
    'background': state.selected_key == "sending" ? state.key_colors.color_1 : "transparent",
    'color': state.selected_key == "sending" ? "#ffffff" : state.key_colors.color_1
  })
  $btn_sending.find('.network__key-text').text(state.key_labels.label_1)
  $btn_sending.find('.network__key-circle').css('background', state.selected_key == "sending" ? "#ffffff" : state.key_colors.color_1)

  $btn_receiving.css({
    'border-color': state.key_colors.color_2,
    'background': state.selected_key == "receiving" ? state.key_colors.color_2 : "transparent",
    'color': state.selected_key == "receiving" ? "#ffffff" : state.key_colors.color_2
  })

  $btn_receiving.find('.network__key-text').text(state.key_labels.label_2)
  $btn_receiving.find('.network__key-circle').css('background', state.selected_key == "receiving" ? "#ffffff" : state.key_colors.color_2)

  $(".network__legend-item.sending .network__legend-circle").css("background-color", state.key_colors.color_1)
  $(".network__legend-item.sending .network__key-text").text(state.key_labels.label_1)

  $(".network__legend-item.receiving .network__legend-circle").css("background-color", state.key_colors.color_2)
  $(".network__legend-item.receiving .network__key-text").text(state.key_labels.label_2)
  
  $('.network__instruction').text(state.instruction)

  $('.network__active__total').css('color', state.selected_key == "sending" ? state.key_colors.color_1 : state.key_colors.color_2)
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

  $network_container.append($network);

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
