{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- RivalX implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------

    rivalx_rivalx.tpl
    
    This is the HTML template of your game.
    
    Everything you are writing in this file will be displayed in the HTML page of your game user interface,
    in the "main game zone" of the screen.
    
    You can use in this template:
    _ variables, with the format {MY_VARIABLE_ELEMENT}.
    _ HTML block, with the BEGIN/END format
    
    See your "view" PHP file to check how to set variables and control blocks
    
    Please REMOVE this comment before publishing your game on BGA
-->
<div id="board">
    <!-- BEGIN square -->
    <div id="square_{X}_{Y}" class="square" style="left: {LEFT}px; top: {TOP}px;"></div>
    <!-- END square -->
    <!-- BEGIN coordinate_marker -->
    <div class="coordinate_marker" style="left: {LEFT}px; top: {TOP}px;">({X}, {Y})</div>
    <!-- END coordinate_marker -->
</div>

<script type="text/javascript">

var jstpl_token = '<div class="token tokencolor_${color}" id="token_${x_y}"></div>';
var jstpl_token_outline = '<div class="token token_outline" id="token_outline_${x_y}"></div>';
var jstpl_scoretile = '<div class="scoretile tilecolor_${color}" id="scoretile_${x_y}"></div>';
var jstpl_pattern = '<div class="pattern patterncolor_${color} patterntype_${type}" id="pattern_${x_y}_${type}"></div>';
var jstpl_lastPlayed = '<div class="lastPlayed lastPlayedcolor_${color}" id="lastPlayed_${x_y}_${player_id}"></div>';
var jstpl_player_board = '<div class="player_board"><div class="playertokens"><div class="token tokencolor_${color} displayToken"></div><div class="counter" id="remainingTokens_${id}"></div></div></div>';
var jstpl_team_icon = '<div class="team team_${teamNum}"</div>';
// Javascript HTML templates

/*
// Example:
var jstpl_some_game_item='<div class="my_game_item" id="my_game_item_${MY_ITEM_ID}"></div>';

*/

</script>  

{OVERALL_GAME_FOOTER}
