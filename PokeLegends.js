// ==UserScript==
// @name         PokeLegends HP
// @namespace    https://halfcrap.com
// @version      0.3
// @description  Show Pokemon Status
// @author       Ripster
// @match        https://www.pokemonlegends.com/explore
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var prevInBattle = bInBattle;
    var lastLine;

    function loadPokemon(link, img, slot) {
        var pokemon = {};

        // Get pokemon page
        $.get(link, function (data) {
            // Find details table
            var details = $(data).find('.container > .mws-panel.grid_6 > .mws-panel-body > .mws-panel-content > table td');
            var re = /expbar"\)\.innerText\s=\s(.+)\s\+\s"\/"\s\+\s(.*);/;
            var expBar = re.exec(data);
            pokemon.exp_pcnt = Math.round(parseInt(expBar[1])/parseInt(expBar[2])*100) + '%';

            // Iterate over columns
            $(details).each(function (idx, obj) {
                var txt = $(obj).text().trim() || $(obj).find('input').attr('value');

                // Skip blank lines
                if (txt) {
                    // Parse data, this is ugly but there isn't any specific classes or id's in the table
                    if (txt.includes('Name: ')) {
                        pokemon.name = txt.split('Name: ')[1];
                    } else if (txt.includes('Level: ')) {
                        pokemon.level = txt.split('Level: ')[1];
                    } else if (txt.includes('Health: ')) {
                        var hp = txt.split('Health: ')[1].split(' / ');
                        pokemon.hp = parseInt(hp[0]);
                        pokemon.max_hp = parseInt(hp[1]);
                        pokemon.hp_pct = Math.round(pokemon.hp / pokemon.max_hp) * 100 + '%';
                    }
                }
            });

            //var expPcnt = parseInt(parseInt(expBar[0]) / parseInt(expBar[1]));
            // Update pokemon slot
            $('#'+slot).replaceWith(
                '<div class="pokemon" id="'+slot+'">'+
                '<div class="pokemon-name">' + pokemon.name + ' Lv.' + pokemon.level + '</div>'+
                '<a href="' + link + '" target="_blank">'+
                '<img src="'+img.attr('src')+'">'+
                '</a>'+
                '<div class=pokemon-hp>' + pokemon.hp + '/' + pokemon.max_hp + '</div>'+
                '<div id="hp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
                '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.hp_pct + ';"></div>'+
                '</div>'+
                '<div id="exp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
                '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.exp_pcnt + ';"></div>'+
                '</div>'+
                '</div>'
            );
        });
    }

    function loadParty() {
        $.get('/team', function (data) {
            var team = $(data).find('.full-box > .box');

            // Get pokemon data
            $.each(team, function (idx, obj) {
                var slotNum = parseInt(idx)+1;
                var slot = 'slot'+slotNum;
                var img = $(obj).find('img');
                var link = $(obj).find('a').attr('href');
                loadPokemon(link, img, slot);
            });
        });
    }

    // Insert party div
    $('#divPm').before(
        '<div id="party">'+
        '<div class="pokemon" id="slot1"></div>'+
        '<div class="pokemon" id="slot2"></div>'+
        '<div class="pokemon" id="slot3"></div>'+
        '<div class="pokemon" id="slot4"></div>'+
        '<div class="pokemon" id="slot5"></div>'+
        '<div class="pokemon" id="slot6"></div>'+
        '</div>'
    );

    // Initially load party
    loadParty();

    // Update after battle
    setInterval(function () {
        if (prevInBattle === true && bInBattle === false) {
            loadParty();
        }
        prevInBattle = bInBattle;
    }, 1000);

    // Update after healing
    setInterval(function () {
        if (activeScript.length > 0) {
            var scriptData = activeScript[0].args;
            if (lastLine !== scriptData) {
                if (scriptData == 'Your Pokemon are fighting fit.') {
                    loadParty();
                }
                lastLine = scriptData;
            }
        }
    }, 10);
})();
