// ==UserScript==
// @name         PokeLegends HP
// @namespace    pokecrap
// @version      0.5
// @description  Show Pokemon Status
// @author       Ripster
// @match        https://www.pokemonlegends.com/explore
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';
    var prevInBattle = bInBattle;
    var lastLine;

    unsafeWindow.pokeTeam = {slot1: {}, slot2: {}, slot3: {}, slot4: {}, slot5: {}, slot6: {}};

    function removePokemon(slot) {
        /* Slot must be in the format of slotX */
        $('#' + slot).children().remove();
        $('#'+slot).append('<div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div>');
        unsafeWindow.pokeTeam[slot] = {};
    }

    function addPokemon(slot, pokemon) {
        /* Slot must be in the format of slotX */
        $('#'+slot).children().remove();
        $('#'+slot).append(
            '<div class="pokemon-name">' + pokemon.name + ' Lv.' + pokemon.level + '</div>'+
            '<a href="' + pokemon.link + '" ondragstart="dragPoke(event)" draggable="true" target="_blank">'+
            '<img src="'+ pokemon.img + '" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)">'+
            '</a>'+
            '<div class=pokemon-hp>' + pokemon.hp + '/' + pokemon.max_hp + '</div>'+
            '<div id="hp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
            '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.hp_pct + ';"></div>'+
            '</div>'+
            '<div id="exp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
            '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.exp_pcnt + ';"></div>'+
            '</div>'
        );
        unsafeWindow.pokeTeam[slot] = pokemon;
    }

    function loadPokemon(link, img, slot) {
        var pokemon = {};

        // Get pokemon page
        $.get(link.attr('href'), function (data) {
            // Get exp percent
            var re = /expbar"\)\.innerText\s=\s(.+)\s\+\s"\/"\s\+\s(.*);/;
            var expBar = re.exec(data);
            pokemon.exp_pcnt = Math.round(parseInt(expBar[1])/parseInt(expBar[2])*100) + '%';

            // Get monster id and image source
            pokemon.mid = link.attr('href').split('?mid=')[1];
            pokemon.img = img.attr('src');

            // Find details table
            var details = $(data).find('.container > .mws-panel.grid_6 > .mws-panel-body > .mws-panel-content > table td');
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
                        pokemon.hp_pct = Math.round(pokemon.hp / pokemon.max_hp * 100) + '%';
                    }
                }
                addPokemon(slot, pokemon);
            });

            // Update pokemon slot
            $('#'+slot).children().remove();
            $('#'+slot).append(
                '<div class="pokemon-name">' + pokemon.name + ' Lv.' + pokemon.level + '</div>'+
                '<a href="' + link + '" ondragstart="dragPoke(event)" draggable="true" target="_blank">'+
                '<img src="'+img.attr('src')+'" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)">'+
                '</a>'+
                '<div class=pokemon-hp>' + pokemon.hp + '/' + pokemon.max_hp + '</div>'+
                '<div id="hp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
                '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.hp_pct + ';"></div>'+
                '</div>'+
                '<div id="exp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
                '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.exp_pcnt + ';"></div>'+
                '</div>'
            );
        });
    }

    function loadParty() {
        $.ajax(
            {
                url: '/team',
                cache: false,
                success: function (data) {
                    // Empty slots
                    var emptySlots = $(data).find('.full-box > .box-empty');
                    // Clear empty slots
                    $.each(emptySlots, function (idx, obj) {
                        var slot = 'slot' + parseInt($(obj).attr('data-spot'));
                        removePokemon(slot);
                    });

                    // Full slots
                    var team = $(data).find('.full-box > .box');
                    // Get pokemon data
                    $.each(team, function (idx, obj) {
                        var slot = 'slot' + parseInt($(obj).attr('data-spot'));
                        var img = $(obj).find('img');
                        var link = $(obj).find('a');
                        loadPokemon(link, img, slot);
                    });
                }
            });
    }
    unsafeWindow.loadParty = loadParty;

    function moveToPC(slot, callback) {
        $.get(
            '/xml/team.xml.php',
            {
                userTeam: slot,
                userMonsters: 0,
                rand: (Math.random() * 1000000)
            },
            callback
        );
    }

    function moveFromPC(slot, mid, callback) {
        $.get(
            '/xml/team.xml.php',
            {
                userTeam: slot,
                userMonsters: mid,
                rand: (Math.random() * 1000000)
            },
            callback
        );
    }

    unsafeWindow.allowPokeDrop = function (ev) {
        ev.preventDefault();
    };

    unsafeWindow.dragPoke = function (ev) {
        ev.dataTransfer.setData("text", $(ev.target).closest('div')[0].id);
    };

    unsafeWindow.dropPoke = function (ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData('text');
        var moveFromSlot = $(document.getElementById(data)).attr('id').split('slot')[1];
        var moveToSlot = $(ev.target).parents('div.pokemon').attr('id').split('slot')[1];
        var midFrom = unsafeWindow.pokeTeam['slot'+moveFromSlot].mid || false;
        var midTo = unsafeWindow.pokeTeam['slot'+moveToSlot].mid || false;

        // Ignore drop on same slot
        if (moveFromSlot !== moveToSlot) {
            // Put the pokemon you want to move into the PC box
            moveToPC(moveFromSlot, function() {
                // If the slot you're trying to move a pokemon into is not empty
                if (midTo) {
                    // Put that pokemon into the PC box
                    moveToPC(moveToSlot, function () {
                        // Move your pokemon from the PC back into your party
                        moveFromPC(moveToSlot, midFrom, function () {
                            moveFromPC(moveFromSlot, midTo, loadParty);
                        });
                    });
                } else {
                    // Move your pokemon from the PC into your target slot
                    moveFromPC(moveToSlot, midFrom, loadParty);
                }
            });
        }
    };

    // Insert party div
    $('#divPm').before(
        '<div id="party">'+
        '<div class="pokemon" id="slot1"><div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div></div>'+
        '<div class="pokemon" id="slot2"><div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div></div>'+
        '<div class="pokemon" id="slot3"><div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div></div>'+
        '<div class="pokemon" id="slot4"><div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div></div>'+
        '<div class="pokemon" id="slot5"><div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div></div>'+
        '<div class="pokemon" id="slot6"><div class="empty-slot" ondrop="dropPoke(event)" ondragover="allowPokeDrop(event)"></div></div>'+
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
