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
		'description' => clienttranslate('${actplayer} must place ${numWildsLeft} more Wild X-pieces on the board'),
		'descriptionmyturn' => clienttranslate('${you} must place ${numWildsLeft} more Wild X-pieces on the board'),
		'type' => 'activeplayer',
		'args' => 'argwildPlacement',
		'possibleactions' => ['placeWild'],
		'transitions' => array(
			'placeWild' => 2,
			'finishTurn' => 11,
		),
	),
	10 => array(
		'name' => 'playerTurn',
		'description' => clienttranslate('${actplayer} must place an X-piece'),
		'descriptionmyturn' => clienttranslate('${you} must place an X-piece'),
		'type' => 'activeplayer',
		'args' => 'argplayerTurn',
		'possibleactions' => ['placeToken'],
		'transitions' => array(
			'placeToken' => 11,
		),
	),
	11 => array(
		'name' => 'nextPlayer',
		'type' => 'game',
		'action' => 'stNextPlayer',
		'updateGameProgression' => true,
		'transitions' => array(
			'nextTurn' => 10,
			'repositionWilds' => 20,
			'endGame' => 99,
		),
		'description' => '',
	),
	20 => array(
		'name' => 'repositionWilds',
		'description' => clienttranslate('${actplayer} has scored a pattern and can reposition Wilds'),
		'descriptionmyturn' => clienttranslate('${you} have scored a pattern and can reposition Wilds'),
		'type' => 'activeplayer',
		'args' => 'argrepositionWilds',
		'possibleactions' => ['moveWild', 'finishTurn'],
		'transitions' => array(
			'moveWild' => 20,
			'finishTurn' => 11,
			'endGame' => 99,
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