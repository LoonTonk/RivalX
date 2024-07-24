<?php
declare(strict_types=1);
/*
 * THIS FILE HAS BEEN AUTOMATICALLY GENERATED. ANY CHANGES MADE DIRECTLY MAY BE OVERWRITTEN.
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RivalX implementation : © LoonTonk
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

/**
 * TYPE CHECKING ONLY, this function is never called.
 * If there are any undefined function errors here, you MUST rename the action within the game states file, or create the function in the game class.
 * If the function does not match the parameters correctly, you are either calling an invalid function, or you have incorrectly added parameters to a state function.
 */
if (false) {
	/** @var rivalx $game */
	$game->stNextPlayer();
}

$machinestates = array(
	1 => array(
		'name' => 'gameSetup',
		'description' => '',
		'type' => 'manager',
		'action' => 'stGameSetup',
		'transitions' => array(
			'' => 2,
		),
	),
	2 => array(
		'name' => 'wildPlacement',
		'description' => clienttranslate('${actplayer} must place all wild tokens on the board'),
		'descriptionmyturn' => clienttranslate('${you} must place all wild tokens on the board'),
		'type' => 'activeplayer',
		'possibleactions' => ['placeWild', 'selectWild', 'finishTurn'],
		'transitions' => array(
			'finishTurn' => 11,
		),
	),
	10 => array(
		'name' => 'playerTurn',
		'description' => clienttranslate('${actplayer} must play a token'),
		'descriptionmyturn' => clienttranslate('${you} must play a token'),
		'type' => 'activeplayer',
		'possibleactions' => ['playToken'],
		'transitions' => array(
			'playToken' => 11,
		),
	),
	11 => array(
		'name' => 'nextPlayer',
		'type' => 'game',
		'action' => 'stNextPlayer',
		'updateGameProgression' => true,
		'transitions' => array(
			'nextTurn' => 10,
			'playPattern' => 20,
			'endGame' => 99,
		),
		'description' => '',
	),
	20 => array(
		'name' => 'wildMovement',
		'description' => clienttranslate('${actplayer} has scored a pattern and must move wilds'),
		'descriptionmyturn' => clienttranslate('${you} have scored a pattern and must move wilds'),
		'type' => 'activeplayer',
		'possibleactions' => ['placeWild', 'selectWild', 'finishTurn'],
		'transitions' => array(
			'finishTurn' => 11,
		),
	),
	99 => array(
		'name' => 'gameEnd',
		'description' => clienttranslate('End of game'),
		'type' => 'manager',
		'action' => 'stGameEnd',
		'args' => 'argGameEnd',
	),
);