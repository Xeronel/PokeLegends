// ==UserScript==
// @name         PokeLegends UI
// @namespace    pokecrap
// @version      1.1
// @description  Pokemon Party UI
// @author       Ripster
// @match        https://www.pokemonlegends.com/explore*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    var prevInBattle = bInBattle;
    var lastLine;

    unsafeWindow.pokeTeam = {slot1: {}, slot2: {}, slot3: {}, slot4: {}, slot5: {}, slot6: {}};

    function hideTooltips() {
        $('#party-info > div').addClass('hidden');
    }

    function removePokemon(slot) {
        /* Slot must be in the format of slotX */
        $('#' + slot).children().remove();
        $('#'+slot).append('<div class="empty-slot" ondrop="pokeUI.dropPoke(event)" ondragover="pokeUI.allowPokeDrop(event)"></div>');
        $('#'+slot+'info').children().remove();
        unsafeWindow.pokeTeam[slot] = {};
    }

    function addPokemon(slot, pokemon) {
        /* Slot must be in the format of slotX */
        // Add pokemon to party
        $('#'+slot).children().remove();
        $('#'+slot).append(
            '<div class="pokemon-name">' + pokemon.name + ' Lv.' + pokemon.level + '</div>'+
            '<div>'+
            '<div class="poke-edit hidden">'+
            '<a href="#" class="mws-i-24 i-pencil-edit" onclick="pokeUI.editSkills(this)"></a>'+
            '</div>'+
            '<a href="' + pokemon.link + '" ondragstart="pokeUI.dragPoke(event)" draggable="true" target="_blank">'+
            '<img src="'+ pokemon.img + '" ondrop="pokeUI.dropPoke(event)" ondragover="pokeUI.allowPokeDrop(event)">'+
            '</a>'+
            '</div>'+
            '<div class=pokemon-hp>' + pokemon.hp + '/' + pokemon.max_hp + '</div>'+
            '<div id="hp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
            '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.hp_pct + ';"></div>'+
            '</div>'+
            '<div id="exp-bar" class="mws-progressbar-exp ui-progressbar ui-widget ui-wdiget-content ui-corner-all" role="progressbar">'+
            '<div class="ui-progressbar-value ui-widget-header ui-corner-all" style="width: ' + pokemon.exp_pcnt + ';"></div>'+
            '</div>'
        );

        // Fill info div
        $('#'+slot+'info').children().remove();
        $('#'+slot+'info').append(
            '<table>'+
            '<thead>'+
            '<tr><th colspan="6">' + pokemon.name + "'s Effort Values</th></tr>"+
            '<tr><th>HP</th><th>Atk</th><th>Def</th><th>Spd</th><th>Spcl Atk</th><th>Spcl Def</th></tr>'+
            '<tbody><tr>'+
            '<tr>'+
            '<td>' + pokemon.ev.hp + '</td>'+
            '<td>' + pokemon.ev.attack + '</td>'+
            '<td>' + pokemon.ev.defence + '</td>'+
            '<td>' + pokemon.ev.speed + '</td>'+
            '<td>' + pokemon.ev.spcl_atk + '</td>'+
            '<td>' + pokemon.ev.spcl_def + '</td>'+
            '</tr>'+
            '</tr></tbody>'+
            '</thead>'+
            '</table>'
        );
        $('#'+slot+'info').append(
            '<table>'+
            '<thead>'+
            '<tr><th colspan="6">' + pokemon.name + "'s Individual Values</th></tr>"+
            '<tr><th>HP</th><th>Atk</th><th>Def</th><th>Spd</th><th>Spcl Atk</th><th>Spcl Def</th></tr>'+
            '<tbody><tr>'+
            '<tr>'+
            '<td>' + pokemon.iv.hp + '</td>'+
            '<td>' + pokemon.iv.attack + '</td>'+
            '<td>' + pokemon.iv.defence + '</td>'+
            '<td>' + pokemon.iv.speed + '</td>'+
            '<td>' + pokemon.iv.spcl_atk + '</td>'+
            '<td>' + pokemon.iv.spcl_def + '</td>'+
            '</tr>'+
            '</tr></tbody>'+
            '</thead>'+
            '</table>'
        );
        unsafeWindow.pokeTeam[slot] = pokemon;
        $('#'+slot+'info').addClass('hidden');
    }

    function loadPokemon(link, img, slot) {
        var pokemon = {};

        // Get pokemon page
        $.get(link.attr('href'), function (data) {
            var dataObj = $(data);

            // Get exp percent
            var re = /expbar"\)\.innerText\s=\s(.+)\s\+\s"\/"\s\+\s(.*);/;
            var expBar = re.exec(data);
            pokemon.exp_pcnt = Math.round(parseInt(expBar[1])/parseInt(expBar[2])*100) + '%';

            // Get monster id and image source
            pokemon.mid = link.attr('href').split('?mid=')[1];
            pokemon.img = img.attr('src');
            pokemon.link = link.attr('href');

            // Find details table
            var details = dataObj.find('.container > .mws-panel.grid_6 > .mws-panel-body > .mws-panel-content > table td');

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
                // HP   Attack  Defence     Speed   Special Attack  Special Defence
                var cells = dataObj.find('.mws-datatable td');
                pokemon.iv = {
                    hp: cells[4].innerHTML,
                    attack: cells[5].innerHTML,
                    defence: cells[6].innerHTML,
                    speed: cells[7].innerHTML,
                    spcl_atk: cells[8].innerHTML,
                    spcl_def: cells[9].innerHTML
                };
                pokemon.ev = {
                    hp: cells[10].innerHTML,
                    attack: cells[11].innerHTML,
                    defence: cells[12].innerHTML,
                    speed: cells[13].innerHTML,
                    spcl_atk: cells[14].innerHTML,
                    spcl_def: cells[15].innerHTML
                };
                addPokemon(slot, pokemon);
            });
        });
    }

    function loadParty() {
        $.ajax(
            {
                url: '/team',
                cache: true,
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

    function hoverEnterSlot () {
        var slot = $(this);
        var infoSlot = $('#' + slot.attr('id') + 'info');
        var edit = slot.find('.poke-edit');
        var pos = slot.position();
        var height = slot.outerHeight();
        var viewport = (pos.left + infoSlot.width()) - $(window).width();

        edit.removeClass('hidden');
        infoSlot.removeClass('hidden');
        infoSlot.css('top', pos.top + height + 'px');
        if (viewport > 0) {
            infoSlot.css('left', (pos.left - viewport) + 'px');
        } else {
            infoSlot.css('left', pos.left + 'px');
        }
    }

    function hoverExitSlot () {
        var slot = $(this);
        var edit = slot.find('.poke-edit');
        var infoSlot = $('#' + slot.attr('id') + 'info');
        infoSlot.addClass('hidden');
        edit.addClass('hidden');
    }

    unsafeWindow.pokeUI = {};

    unsafeWindow.pokeUI.allowPokeDrop = function (ev) {
        ev.preventDefault();
    };

    unsafeWindow.pokeUI.dragPoke = function (ev) {
        ev.dataTransfer.setData("text", $(ev.target).parents('.pokemon')[0].id);
        hideTooltips();
    };

    unsafeWindow.pokeUI.dropPoke = function (ev) {
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

    unsafeWindow.pokeUI.editSkills = function (e) {
        var slot = $(e).parents('.pokemon').attr('id');
        var link = unsafeWindow.pokeTeam[slot].link;
        var name = unsafeWindow.pokeTeam[slot].name;
        $.get(link, function (data) {
            data = $(data);
            var dropdown = data.find('.mws-datatable td select');
            var skills = dropdown[0].innerHTML;
            var skillDiv = $('#pokeSkills');
            skillDiv.children().remove();
            skillDiv.append(
                '<div class="mws-panel-header">'+
                '<span class="mws-i-24 i-table-1">'+name+"'s Moves</span>"+
                '</div>'+
                '<div class="mws-panel-body clearfix">'+
                '<form id="pokeSkillForm">'+
                '<select class="poke-select" id="pokeAtk1" name="atk1">'+skills +'</select>'+
                '<select class="poke-select" id="pokeAtk2" name="atk2">'+skills +'</select>'+
                '<select class="poke-select" id="pokeAtk3" name="atk3">'+skills +'</select>'+
                '<select class="poke-select" id="pokeAtk4" name="atk4">'+skills +'</select>'+
                '<button id="skillCancel" class="mws-button red">Cancel</button>'+
                '<input id="skillSubmit" type="text" name="updateSkills" class="mws-button green" value="Save Attack Order">'+
                '</form>'+
                '</div>'
            );
            skillDiv.find('#pokeAtk2 option[value='+dropdown[1].value+']').prop('selected', true).change();
            skillDiv.find('#pokeAtk3 option[value='+dropdown[2].value+']').prop('selected', true).change();
            skillDiv.find('#pokeAtk4 option[value='+dropdown[3].value+']').prop('selected', true).change();
            $('#skillCancel').click(function () {
                skillDiv.addClass('hidden');
                skillDiv.children().remove();
            });
            var pokeSkillForm = $('#pokeSkillForm');
            pokeSkillForm.submit(function (event) { event.preventDefault(); });
            $('#skillSubmit').click(function () {
                $('#pokeSkills').addClass('hidden');
                $.ajax({
                    type: 'POST',
                    url: link+'&action=SkillUpdated',
                    data: pokeSkillForm.serialize()
                });
            });
            skillDiv.removeClass('hidden');
            $('.poke-select').chosen();
        });
    };

    // Build div html
    var partyDiv = '<div id="party">';
    var infoDiv = '<div id="party-info">';
    for (var i = 1; i < 7; i++) {
        var slot = 'slot' + i;
        var slotInfo = slot + 'info';
        partyDiv += '<div class="pokemon" id="' + slot + '"><div class="empty-slot" ondrop="pokeUI.dropPoke(event)" ondragover="pokeUI.allowPokeDrop(event)"></div></div>';
        infoDiv += '<div id="' + slotInfo + '" class="hidden info-slot"></div>';
    }
    partyDiv += '</div>';
    infoDiv += '</div>';

    // Insert divs
    $('#divPm').before(partyDiv);
    $('#party').after(infoDiv);
    $('.container').append('<div class="mws-panel hidden" id="pokeSkills"></div>');

    // Add onhover events
    $('.pokemon').hover(hoverEnterSlot, hoverExitSlot);

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
                if (scriptData == 'Your Pokemon are fighting fit.' || scriptData === '...And done. Your Pokemon are good to go!') {
                    loadParty();
                }
                lastLine = scriptData;
            }
        }
    }, 10);
})();
