<?php
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

class action_rivalx extends APP_GameAction
{
	/** @var rivalx $game */
	protected $game; // Enforces functions exist on Table class

	// Constructor: please do not modify
	public function __default()
	{
		if (self::isArg('notifwindow')) {
			$this->view = "common_notifwindow";
			$this->viewArgs['table'] = self::getArg("table", AT_posint, true);
		} else {
			$this->view = "rivalx_rivalx";
			self::trace("Complete reinitialization of board game");
		}
	}

	public function placeWild()
	{
		self::setAjaxMode();

		/** @var int $x */
		$x = self::getArg('x', AT_int, true);
		/** @var int $y */
		$y = self::getArg('y', AT_int, true);

		$this->game->placeWild( $x, $y );
		self::ajaxResponse();
	}

	public function selectWild()
	{
		self::setAjaxMode();

		/** @var int $x */
		$x = self::getArg('x', AT_int, true);
		/** @var int $y */
		$y = self::getArg('y', AT_int, true);

		$this->game->selectWild( $x, $y );
		self::ajaxResponse();
	}

	public function moveWild()
	{
		self::setAjaxMode();

		/** @var int $old_x */
		$old_x = self::getArg('old_x', AT_int, true);
		/** @var int $old_y */
		$old_y = self::getArg('old_y', AT_int, true);
		/** @var int $new_x */
		$new_x = self::getArg('new_x', AT_int, true);
		/** @var int $new_y */
		$new_y = self::getArg('new_y', AT_int, true);

		$this->game->moveWild( $old_x, $old_y, $new_x, $new_y );
		self::ajaxResponse();
	}

	public function finishTurn()
	{
		self::setAjaxMode();

		$this->game->finishTurn(  );
		self::ajaxResponse();
	}

	public function placeToken()
	{
		self::setAjaxMode();

		/** @var int $x */
		$x = self::getArg('x', AT_int, true);
		/** @var int $y */
		$y = self::getArg('y', AT_int, true);

		$this->game->placeToken( $x, $y );
		self::ajaxResponse();
	}
}