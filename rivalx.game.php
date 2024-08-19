<?php
 /**
  *------
  * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
  * RivalX implementation : © <Your name here> <Your email address here>
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  * 
  * rivalx.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */

//TODO: fix statistic for how a player won, for some reason it lists it for all players right now
require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );


class RivalX extends Table
{
    const MAX_WILDS = 5;
    const POINTS_TO_WIN = array(2 => 15, 3 => 12, 4 => 10, '2v2' => 12);
    const PLAYER_TOKEN_COUNT = 15;
    const TEAM_NAMES = array(1 => "blue", 2 => "red"); // TODO: change the names to be more interesting
    const BOARD_HEIGHT = 8;
    const BOARD_WIDTH = 8;
	function __construct( )
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels( array( 

            "ffa_or_teams" => 100

        ) );        
	}
	
    protected function getGameName( )
    {
		// Used for translations and stuff. Please do not modify.
        return "rivalx";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = array() )
    {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_tokens_left, player_team) VALUES ";
        $values = array();
        $player_token_count = self::PLAYER_TOKEN_COUNT;
        if ($this->getGameStateValue('ffa_or_teams') == 2) {
            $first_team = true;
            foreach( $players as $player_id => $player )
            {
                $color = array_shift( $default_colors );
                $player_info = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."','".$player_token_count."',";
                if ($first_team) {
                    $player_info .= "1)";
                } else {
                    $player_info .= "2)";
                }
                $values[] = $player_info;
                $first_team = !$first_team;
            }
        } else { // base variant
            foreach( $players as $player_id => $player )
            {
                $color = array_shift( $default_colors );
                $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."','".$player_token_count."',0)";
            }
        }
        $sql .= implode( ',', $values );
        $this->DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        foreach ($players as $player_id => $player) {
            $this->initStat( 'player', 'tokens_placed', 0, $player_id );
            $this->initStat( 'player', 'scoretiles_made', 0, $player_id );
            $this->initStat( 'player', 'scoretiles_lost', 0, $player_id );
            $this->initStat( 'player', 'scoretiles_taken', 0, $player_id );
            $this->initStat( 'player', 'rowPatterns_made', 0, $player_id );
            $this->initStat( 'player', 'colPatterns_made', 0, $player_id );
            $this->initStat( 'player', 'diagPatterns_made', 0, $player_id );
            $this->initStat( 'player', 'plusPatterns_made', 0, $player_id );
            $this->initStat( 'player', 'XPatterns_made', 0, $player_id );
            $this->initStat( 'player', 'combinationPatterns_made', 0, $player_id );
            $this->initStat( 'player', 'wilds_moved', 0, $player_id );
            $this->initStat( 'player', 'wilds_used', 0, $player_id );
        }
        //$this->initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        $sql = "INSERT INTO board (board_x,board_y,board_player,board_player_tile,board_selectable,board_lastPlayed) VALUES ";
        $sql_values = array();
        for( $x=1; $x<=8; $x++ )
        {
            for( $y=1; $y<=8; $y++ )
            {
                $sql_values[] = "($x,$y,-1,-1,0,-1)";
            }
        }
        $sql .= implode( ',', $sql_values );
        self::DbQuery( $sql );

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas()
    {
        $result = array();
    
        $current_player_id = $this->getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score FROM player ";
        $result['players'] = $this->getCollectionFromDb( $sql );
        $result['playerTeams'] = $this->getCollectionFromDb( "SELECT player_id id, player_team team FROM player", true );
        $sql = "SELECT board_x x, board_y y, board_player player, board_player_tile player_tile, board_selectable selectable, board_lastPlayed lastPlayed
        FROM board";
        $result['board'] = self::getObjectListFromDB( $sql );
        $result['tokensLeft'] = $this->getCollectionFromDB( "SELECT player_id id, player_tokens_left tokensLeft FROM player", true );
        $result['isTeams'] = ($this->getGameStateValue('ffa_or_teams') == 2);
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression()
    {
        $highest_score = self::getUniqueValueFromDb("SELECT MAX(player_score) FROM player");
        if ($this->getGameStateValue('ffa_or_teams') == 2) {
            $points_to_win = self::POINTS_TO_WIN['2v2'];
        } else {
            $points_to_win = self::POINTS_TO_WIN[$this->getPlayersNumber()];
        }
        $progression_to_win = $highest_score / $points_to_win * 100;
        
        $max_wilds = self::MAX_WILDS;
        $total_tokens_played = self::getUniqueValueFromDb("SELECT COUNT(*) FROM board WHERE board_player > $max_wilds");
        $total_possible_tokens = self::PLAYER_TOKEN_COUNT * $this->getPlayersNumber();
        $total_token_progression = $total_tokens_played / $total_possible_tokens * 100;

        return round(($progression_to_win + $total_token_progression) / 2);
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    // Returns the given array but with only unique values
    function makeUnique($arrays) {
        // Encode each array to a JSON string
        $jsonArrays = array_map(function($array) {
            return json_encode($array);
        }, $arrays);
    
        // Remove duplicates
        $uniqueJsonArrays = array_unique($jsonArrays);
    
        // Decode the JSON strings back to arrays
        $uniqueArrays = array_map(function($json) {
            return json_decode($json, true); // Decode as associative array
        }, $uniqueJsonArrays);
    
        // Reindex the array to ensure consecutive numeric indices
        return array_values($uniqueArrays);
    }

    // Return true if the given id is a wild
    function isWild($id) {
        return ($id >= 1 && $id <= self::MAX_WILDS);
    }

    // Get the complete board with a double associative array
    function getBoard()
    {
        $sql = "SELECT board_x x, board_y y, board_player player, board_player_tile player_tile, board_selectable selectable FROM board";
        return self::getDoubleKeyCollectionFromDB( $sql );
    }

    // Returns an array of all wilds on board
    function getWilds() {
        $max_wilds = self::MAX_WILDS;
        $sql = "SELECT board_x x, board_y y FROM board WHERE (board_player) BETWEEN 1 AND $max_wilds"; // Find all the spots with token id between 1 and MAX_WILDS, i.e wild token
        $result = self::getObjectListFromDB( $sql );
        return $result;
    }

    // Returns number of wilds on board
    function getNumWilds() {
        return count(self::getWilds());
    }

    // Returns true if a player has achieved enough points
    function checkForPointsWin() {
        if ($this->getGameStateValue('ffa_or_teams') == 2) {
            $points_to_win = self::POINTS_TO_WIN['2v2']; //TODO: maybe the game should not be a tie for the winning team?
        } else {
            $points_to_win = self::POINTS_TO_WIN[$this->getPlayersNumber()];
        }
        $playerHasWon = false;
        $scores = $this->getCollectionFromDB( "SELECT player_id, player_score FROM player", true );
        foreach($scores as $player => $score) {
            if ((int)$score >= $points_to_win) {
                self::setStat(0, 'victory_type');
                self::setStat(0, 'victory_type_player', $player);
                $playerHasWon = true;
            }
        }
        return $playerHasWon;
    }

    function zombiePlaceWilds() {
        $max_wilds = self::MAX_WILDS;
        $curr_wilds = self::getUniqueValueFromDb("SELECT COUNT(*) FROM board WHERE board_player BETWEEN 1 AND $max_wilds");
        $board = self::getBoard();
        while ($curr_wilds < $max_wilds) {
            $x = mt_rand(1, self::BOARD_WIDTH);
            $y = mt_rand(1, self::BOARD_HEIGHT);
            if (isset($this->getPossibleWildPlacements($board)[$x][$y])) { // This is a valid wild placement
                $curr_wilds++;
                self::DbQuery( "UPDATE board SET board_player = $curr_wilds WHERE (board_x, board_y) IN (($x,$y))" );
                self::notifyAllPlayers( "playToken", clienttranslate( 'A wild token has automatically been placed at (${x}, ${y}), ${numWilds}/${max_wilds} placed' ), array(
                    'player_id' => $curr_wilds,
                    'player_name' => self::getActivePlayerName(),
                    'x' => $x,
                    'y' => $y,
                    'numWilds' => $curr_wilds,
                    'max_wilds' => $max_wilds,
                    'lastPlayed' => -1
                ) );
                $board = self::getBoard();
            }
        }
    }

    // Need to notify and sql remove tokens (including token number), add point tiles, update score, make wilds selectable, highlight pattern
    // Returns true if there are no wilds in the pattern
    function updateBoardOnPattern($patternTokens, $board) {

        // First, separate pattern Tokens into player and non player
        $patterns = array();
        $playerTokens = array();
        $wildTokens = array();
        foreach ($patternTokens as $pattern => $tokenList) {
            $patterns[] = $pattern;
            foreach ($tokenList as $token) {
                if (self::isWild($board[$token['x']][$token['y']]['player'])) {
                    $wildTokens[] = $token;
                } else {
                    $playerTokens[] = $token;
                }
            }
        }
        $playerTokens = self::makeUnique($playerTokens);
        $wildTokens = self::makeUnique($wildTokens);

        $player_id = $board[$playerTokens[0]['x']][$playerTokens[0]['y']]['player'];

        // Track previous scores to compare later
        if ($this->getGameStateValue('ffa_or_teams') == 2) {
            $oldScores = self::getCollectionFromDb("SELECT player_team, player_score FROM player", true);
        } else {
            $oldScores = self::getCollectionFromDb( "SELECT player_id, player_score FROM player", true );
        }
        // Track previous number of tiles for statistics later
        $max_wilds = self::MAX_WILDS;
        $old_tiles = self::getCollectionFromDb( "SELECT board_player_tile, COUNT(*) FROM board WHERE board_player_tile > $max_wilds GROUP BY board_player_tile", true );

        // Next, update the board table (remove tokens, add point tiles)
        $sql = "UPDATE board SET board_player = -1, board_player_tile = $player_id WHERE (board_x, board_y) IN (";
        foreach($playerTokens as $token) {
            $sql .= "(".$token['x'].",".$token['y']."),";
        }
        $sql = substr($sql, 0, -1) . ")"; // Removes the last character
        self::DbQuery( $sql );

        // Remove lastPlayed from the player who just made a pattern
        self::DbQuery("UPDATE board SET board_lastPlayed = -1 WHERE board_player = $player_id");

        // Then update score for all players
        $player_ids =  array_keys($this->loadPlayersBasicInfos());  
        foreach ($player_ids as $player) {
            self::DbQuery( "UPDATE player SET player_score = (SELECT COUNT(*) AS player_tiles FROM board WHERE board_player_tile = '$player') WHERE player_id = $player" );
        }

        if ($this->getGameStateValue('ffa_or_teams') == 2) { // If teams mode, score needs to be readjusted again
            $teamScores = self::getCollectionFromDb("SELECT player_team, SUM(player_score) AS total_score FROM player GROUP BY player_team", true);
            foreach ($teamScores as $team => $score) {
                self::DbQuery("UPDATE player SET player_score = $score WHERE player_team = $team");
            }
        }

        // update token count for player who made pattern
        $tokens_back = count($playerTokens);
        self::DbQuery( "UPDATE player SET player_tokens_left = player_tokens_left + $tokens_back WHERE player_id = $player_id" );
        // Make wilds selectable (if any exist)
        if (count($wildTokens) > 0) {
            $sql = "UPDATE board SET board_selectable = 1 WHERE (board_x, board_y) IN (";
            foreach($wildTokens as $token) {
                $sql .= "(".$token['x'].",".$token['y']."),";
            }
            $sql = substr($sql, 0, -1) . ")"; // Removes the last character
            self::DbQuery( $sql );
        }

        // Notify add point tiles
        $tokensToRemove = array();
        foreach ($playerTokens as $token) {
            $tokensToRemove[] = array('x' => $token['x'], 'y' => $token['y'], 'player_id' => $player_id);
        }

        // Notify outline patterns
        $centerToken = $patternTokens[$patterns[0]][0]; // Gets the first token in the first pattern

        // Notify score Pattern
        if (count($patterns) > 1) {
            $patternName = 'Combination';
        } else {
            $patternCode = substr($patterns[0],0,3);
            switch ($patternCode) {
                case ('row'):
                case ('col'):
                case ('nwd'):
                case ('ned'):
                    $patternName = 'Five-in-a-row';
                    break;
                case ('pls'):
                    $patternName = 'Plus';
                    break;
                case ('crs'):
                    $patternName = 'X';
                    break;
                default:
                    throw new feException( "When parsing pattern code did not match any known pattern: ".$patternCode );
            }
        }

        self::notifyAllPlayers('markSelectableTokens', '', $wildTokens);

        // Score change message
        $newScores = $this->getGameStateValue('ffa_or_teams') == 2 ? 
        self::getCollectionFromDb("SELECT player_team, player_score FROM player", true): self::getCollectionFromDb("SELECT player_id, player_score FROM player", true);

        $scoreGainMessage = '';
        $scoreLossMessage = '';
        foreach ($newScores as $player_or_team => $newScore) { // First pass finds the players/teams who gained points
            $scoreChange = $newScore - $oldScores[(int)$player_or_team];
            if ($scoreChange > 0) {
                if (strlen($scoreGainMessage) > 0) {
                    $scoreGainMessage .= ", ";
                }
                if ($this->getGameStateValue('ffa_or_teams') == 2) {
                    $teamName = self::TEAM_NAMES[(int)$player_or_team];
                    $scoreGainMessage .= sprintf(self::_('%s team scores %d point(s)'), $teamName, $scoreChange);
                } else {
                    $playerName = $this->getPlayerNameById($player_or_team);
                    $scoreGainMessage .= sprintf(self::_('%s scores %d point(s)'), $playerName, $scoreChange);
                }
            }
        }
        foreach ($newScores as $player_or_team => $newScore) { // Second pass finds the players/teams who lost points
            $scoreChange = $newScore - $oldScores[(int)$player_or_team];
            if ($scoreChange < 0) {
                if (strlen($scoreLossMessage) > 0) {
                    $scoreLossMessage .= ", ";
                }
                if ($this->getGameStateValue('ffa_or_teams') == 2) {
                    $teamName = self::TEAM_NAMES[(int)$player_or_team];
                    $scoreLossMessage .= sprintf(self::_('%s team loses %d point(s)'), $teamName, -$scoreChange);
                } else {
                    $playerName = $this->getPlayerNameById($player_or_team);
                    $scoreLossMessage .= sprintf(self::_('%s loses %d point(s)'), $playerName, -$scoreChange);
                }
            }
        }
        // Combine the scoreChange and scoreLoss messages
        $scoreChangeMessage = $scoreGainMessage;
        if (strlen($scoreGainMessage) > 0 && strlen($scoreLossMessage) > 0) {
            $scoreChangeMessage .= ', ';
        }
        $scoreChangeMessage .= $scoreLossMessage;

        $player_name = $this->getPlayerNameById($player_id);
        if ($patternName !== 'Combination') {
            self::notifyAllPlayers( 'scorePattern', clienttranslate('${player_name} has completed a ${pattern_name} pattern').', '.$scoreChangeMessage, array( //TODO: list tiles the pattern was on?
                'x' => $centerToken['x'],
                'y' => $centerToken['y'],
                'patternCode' => $patterns[0],
                'player_id' => $player_id,
                'player_name' => $player_name,
                'pattern_name' => $patternName,
            ) ); 
        } else {
            foreach($patterns as $index => $pattern) {
                if ($index === 0) {
                    self::notifyAllPlayers( 'scorePattern', clienttranslate('${player_name} has completed a ${pattern_name} pattern').', '.$scoreChangeMessage, array( //TODO: list tiles the pattern was on?
                        'x' => $centerToken['x'],
                        'y' => $centerToken['y'],
                        'patternCode' => $pattern,
                        'player_id' => $player_id,
                        'player_name' => $player_name,
                        'pattern_name' => $patternName,
                    ) );
                } else {
                    self::notifyAllPlayers( 'scorePattern', '', array( //TODO: list tiles the pattern was on?
                        'x' => $centerToken['x'],
                        'y' => $centerToken['y'],
                        'patternCode' => $pattern,
                        'player_id' => $player_id,
                    ) );
                }
            }
        }

        self::notifyAllPlayers('removeTokens', '', $tokensToRemove);
        self::notifyAllPlayers( "newScores", '', array(
            "scores" => $newScores
        ) );

        // Statistics
        $new_tiles = self::getCollectionFromDb( "SELECT board_player_tile, COUNT(*) FROM board WHERE board_player_tile > $max_wilds GROUP BY board_player_tile", true );
        self::incStat($new_tiles[$player_id] - ($old_tiles[$player_id] ?? 0), 'scoretiles_made', $player_id);
        foreach ($old_tiles as $player => $old_tile_count) {
            $tiles_lost = $old_tile_count - ($new_tiles[$player] ?? 0);
            if ($tiles_lost > 0) {
                self::incStat($tiles_lost, 'scoretiles_lost', $player);
                self::incStat($tiles_lost, 'scoretiles_taken', $player);
            }
        }
        // TODO: possibly change this so combination patterns increment stats for all the patterns in them?
        switch ($patternName) {
            case ('Five-in-a-row'):
                self::incStat(1, 'rowPatterns_made', $player_id); // TODO: If mark gives the go-ahead, change stats to have all of these under Five-in-a-row
                break;
            case ('Plus'):
                self::incStat(1, 'plusPatterns_made', $player_id);
                break; 
            case ('X'):
                self::incStat(1, 'XPatterns_made', $player_id);
                break; 
            case ('Combination'):
                self::incStat(1, 'combinationPatterns_made', $player_id);
                break; 
            default:
                throw new feException("Notifications for the type of pattern made did not recognize the patterncode: ".$patternName);
        }
        self::incStat(count($wildTokens), 'wilds_used', $player_id);

        if (count($wildTokens) == 0) {
            return true;
        }
    }

    // Gets array of all the possible pattern combinations
    function getPatternArrays() {
        $row_1 = array(array(1,0), array(2,0), array(3,0), array(4,0));
        $row_2 = array(array(-1,0), array(1,0), array(2,0), array(3,0));
        $row_3 = array(array(-2,0), array(-1,0), array(1,0), array(2,0));
        $row_4 = array(array(-3,0), array(-2,0), array(-1,0), array(1,0));
        $row_5 = array(array(-4,0), array(-3,0), array(-2,0), array(-1,0));
        $col_1 = array(array(0,1), array(0,2), array(0,3), array(0,4));
        $col_2 = array(array(0,-1), array(0,1), array(0,2), array(0,3));
        $col_3 = array(array(0,-2), array(0,-1), array(0,1), array(0,2));
        $col_4 = array(array(0,-3), array(0,-2), array(0,-1), array(0,1));
        $col_5 = array(array(0,-4), array(0,-3), array(0,-2), array(0,-1));
        $nwd_1 = array(array(1,1), array(2,2), array(3,3), array(4,4));
        $nwd_2 = array(array(-1,-1), array(1,1), array(2,2), array(3,3));
        $nwd_3 = array(array(-2,-2), array(-1,-1), array(1,1), array(2,2));
        $nwd_4 = array(array(-3,-3), array(-2,-2), array(-1,-1), array(1,1));
        $nwd_5 = array(array(-4,-4), array(-3,-3), array(-2,-2), array(-1,-1));
        $ned_1 = array(array(-1,1), array(-2,2), array(-3,3), array(-4,4));
        $ned_2 = array(array(1,-1), array(-1,1), array(-2,2), array(-3,3));
        $ned_3 = array(array(2,-2), array(1,-1), array(-1,1), array(-2,2));
        $ned_4 = array(array(3,-3), array(2,-2), array(1,-1), array(-1,1));
        $ned_5 = array(array(4,-4), array(3,-3), array(2,-2), array(1,-1));
        $pls_W = array(array(1,-1), array(1,0), array(1,1), array(2,0));
        $pls_N = array(array(0,1), array(-1,1), array(1,1), array(0,2));
        $pls_E = array(array(-1,-1), array(-1,0), array(-1,1), array(-2,0));
        $pls_S = array(array(0,-1), array(-1,-1), array(1,-1), array(0,-2));
        $pls_C = array(array(1,0), array(-1,0), array(0,1), array(0,-1));
        $crs_NW = array(array(2,0), array(0,2), array(2,2), array(1,1));
        $crs_NE = array(array(-2,0), array(0,2), array(-2,2), array(-1,1));
        $crs_SE = array(array(-2,0), array(0,-2), array(-2,-2), array(-1,-1));
        $crs_SW = array(array(2,0), array(0,-2), array(2,-2), array(1,-1));
        $crs_CE = array(array(1,1), array(1,-1), array(-1,1), array(-1,-1));
        // Merge all arrays into one giant nested array
        return array(
            'row_1' => $row_1, // Row, starting at left
            'row_2' => $row_2,
            'row_3' => $row_3,
            'row_4' => $row_4,
            'row_5' => $row_5,
            'col_1' => $col_1, // Col, starting at top
            'col_2' => $col_2,
            'col_3' => $col_3,
            'col_4' => $col_4,
            'col_5' => $col_5,
            'nwd_1' => $nwd_1, // NW->SE diagonal, starting NW
            'nwd_2' => $nwd_2,
            'nwd_3' => $nwd_3,
            'nwd_4' => $nwd_4,
            'nwd_5' => $nwd_5,
            'ned_1' => $ned_1, // NE-SW diagonal, starting NE
            'ned_2' => $ned_2,
            'ned_3' => $ned_3,
            'ned_4' => $ned_4,
            'ned_5' => $ned_5,
            'pls_W' => $pls_W, // Plus, starting at cardinal direction or C for center
            'pls_N' => $pls_N,
            'pls_E' => $pls_E,
            'pls_S' => $pls_S,
            'pls_C' => $pls_C,
            'crs_NW' => $crs_NW, // Cross (X) starting at cardinal direction or CE for center
            'crs_NE' => $crs_NE,
            'crs_SE' => $crs_SE,
            'crs_SW' => $crs_SW,
            'crs_CE' => $crs_CE
        );
    }

    function getPatternTokens($board) {
        $max_wilds = self::MAX_WILDS;
        $sql = "SELECT board_x x, board_y y, board_player player FROM board WHERE board_lastPlayed > $max_wilds AND board_player > $max_wilds"; 
        $lastPlayedArray = self::getObjectListFromDB( $sql );
        if (count($lastPlayedArray) > 0) { // there are lastPlayed tokens
            foreach ($lastPlayedArray as $lastPlayed) {
                $patternTokens = self::getPatternTokensAtxy($lastPlayed['x'], $lastPlayed['y'], $lastPlayed['player'], $board);
                if (count($patternTokens) > 0) {
                    return $patternTokens;
                }
            }
        }
        return array();
    }

    function getPatternTokensAtxy(int $x, int $y, $player_id, $board) {
        $mayBePattern = array();
        $result = array();
        $patternArrays = self::getPatternArrays();
        foreach ($patternArrays as $patternName => $patternArray) {
            foreach ($patternArray as $pattern) {
                $curr_x = $x + $pattern[0];
                $curr_y = $y + $pattern[1];
                if (($curr_x>=1 && $curr_x<=8 && $curr_y>=1 && $curr_y<=8) &&
                ($board[$curr_x][$curr_y]['player'] == $player_id || self::isWild($board[$curr_x][$curr_y]['player']))) { // Spot is either token of player or wild
                    $mayBePattern[] = array('x' => $curr_x, 'y' => $curr_y);
                } else { // spot is not pattern token
                    array_splice($mayBePattern, 0); // Clears mayBePattern
                    break;
                }
            }
            if (count($mayBePattern) >= 4) {
                array_unshift($mayBePattern, array('x' => $x, 'y' => $y)); // Adds the current x and y to the front of the pattern for easy access
                $result = array_merge( $result, array($patternName => $mayBePattern) );
            }
            array_splice($mayBePattern, 0); // Clears mayBePattern
        }
        return $result;
    }

    // Returns a wild pattern array if putting a wild token at this x,y creates a wild pattern
    function checkWildPatternExists(int $x, int $y, $board) {
        $mayBePattern = array();
        $patternArrays = self::getPatternArrays();
        foreach ($patternArrays as $patternName => $patternArray) {
            foreach ($patternArray as $pattern) {
                $curr_x = $x + $pattern[0];
                $curr_y = $y + $pattern[1];
                if (($curr_x>=1 && $curr_x<=8 && $curr_y>=1 && $curr_y<=8) && self::isWild($board[$curr_x][$curr_y]['player'])) { // Spot is wild token
                    $mayBePattern[] = array('x' => $curr_x, 'y' => $curr_y);
                } else { // spot is not pattern token
                    array_splice($mayBePattern, 0); // Clears mayBePattern
                    break;
                }
            }
            if (count($mayBePattern) >= 4) {
                array_unshift($mayBePattern, array('x' => $x, 'y' => $y)); // Adds the current x and y to the front of the pattern for easy access
                return array($patternName => $mayBePattern);
            }
            array_splice($mayBePattern, 0); // Clears mayBePattern
        }
        return array();
    }

    // Returns a list of all possible player moves in current state (does not count moving wilds)
    function getPossibleMoves($state) {
        $board = self::getBoard();
        $result = array();
        switch ($state) {
            case 'wildPlacement':
                return $this->getPossibleWildPlacements($board);
            case 'playerTurn':
                for ($x = 1; $x <= 8; $x++) {
                    for ($y = 1; $y <= 8; $y++) {
                        if ($board[$x][$y]['player'] == -1) { //player is empty
                            // Okay => set this coordinate to "true"
                            if( ! isset( $result[$x] ) ) {
                                $result[$x] = array();
                            }
                            $result[$x][$y] = true;
                        }
                    }
                }
                return $result;
            case 'repositionWilds':
                $allResults = array();
                $player_ids =  array_keys($this->loadPlayersBasicInfos());  
                $movableWilds = self::getObjectListFromDb("SELECT board_x x, board_y y FROM board WHERE board_selectable = 1");
                foreach ($movableWilds as $wild) {
                    // Need to type cast because sql returns the vals all as strings
                    $wild['x'] = (int)$wild['x'];
                    $wild['y'] = (int)$wild['y']; 
                    // Treat the wild as not existing for checking valid moves, as if that wild is being moved
                    $wild_id = $board[$wild['x']][$wild['y']]['player'];
                    $board[$wild['x']][$wild['y']]['player'] = -1;

                    for ($x = 1; $x <= 8; $x++) {
                        for ($y = 1; $y <= 8; $y++) {
                            if ($board[$x][$y]['player'] > -1) { // There is already a token here
                                continue;
                            }
                            if (count(self::checkWildPatternExists($x,$y,$board))) { // If a pattern of all wilds exists, it is a valid spot
                                if( ! isset( $result[$x] ) ) {
                                    $result[$x] = array();
                                }
                                $result[$x][$y] = true;
                                continue;
                            } else {
                                $validMove = true;
                                foreach ($player_ids as $player) {
                                    if (count(self::getPatternTokensAtxy($x, $y, $player, $board)) > 0) { // A pattern exists, move is not possible
                                        $validMove = false;
                                        break;
                                    }
                                }
                                if ($validMove) {
                                    if( ! isset( $result[$x] ) ) {
                                        $result[$x] = array();
                                    }
                                    $result[$x][$y] = true;
                                }
                            }
                        }
                    }
                    $allResults[$wild_id] = $result;
                    array_splice($result, 0); // Clears $result
                    $board[$wild['x']][$wild['y']]['player'] = $wild_id; // Put the token back for checking the rest of the possible patterns
                }
                return $allResults;
            default:
                throw new feException("get possible moves called with an invalid arg");
        }
    }

    // Returns an array of the possible initial wild placements
    function getPossibleWildPlacements($board) {
        $directions = array(
            array( -1,-1 ), array( -1,0 ), array( -1, 1 ), array( 0, -1),array( 0, 0),
            array( 0,1 ), array( 1,-1), array( 1,0 ), array( 1, 1 )
        );
        for ($x = 1; $x <= 8; $x++) {
            for ($y = 1; $y <= 8; $y++) {
                $valid_spot = true;
                foreach( $directions as $direction ) {
                    $current_x = $x + $direction[0];
                    $current_y = $y + $direction[1];
                    if( $current_x<1 || $current_x>8 || $current_y<1 || $current_y>8 )
                        continue; // Out of the board => stop here for this direction
                    else if (self::isWild($board[$current_x][$current_y]['player'])) {
                        $valid_spot = false;
                    }
                }
                if ($valid_spot) {
                    if( ! isset( $result[$x] ) ) {
                        $result[$x] = array();
                    }
                    $result[$x][$y] = true;
                }
            }
        }
        return $result;
    }

    // returns true if all players have tokens, false if any player has run out of tokens
    function allPlayersHaveTokens() {
        $player_tokens_count = $this->getObjectListFromDB( "SELECT player_id player, player_tokens_left tokensLeft, player_score score FROM player" );
        foreach($player_tokens_count as $player_token_count) {
            if ((int)$player_token_count['tokensLeft'] <= 0) { // A player has run out of tokens
                $highest_score = 0;
                $highest_score_players = array();
                foreach ($player_tokens_count as $player_score_count) {
                    $player_score = (int)$player_score_count['score'];
                    if ($player_score > $highest_score) { // If score is higher than previous highest, clear highest score players and add self to it
                        array_splice($highest_score_players, 0);
                        $highest_score_players[] = $this->getPlayerNameById((int)$player_score_count['player']);
                        $highest_score = $player_score;
                    } else if ($player_score === $highest_score) { // If score is equal, add player to highest score players
                        $highest_score_players[] = $this->getPlayerNameById((int)$player_score_count['player']);
                    } // Otherwise, do nothing
                }   

                $winning_players = $highest_score_players[0];
                if (count($highest_score_players) > 1) {
                    $other_highest_score_players = array_diff($highest_score_players, [$highest_score_players[0]]);
                    foreach ($other_highest_score_players as $player_name) {
                        $winning_players .= ', '.$player_name;
                    }
                }
                self::setStat(1, 'victory_type');
                foreach ($highest_score_players as $player) {
                    self::setStat(1, 'victory_type_player', $player);
                }
                self::notifyAllPlayers( "blockadeWin", clienttranslate('${winning_players} won via a blockade win!'), array(
                    "winning_players" => $winning_players
                ) );
                return false;
            }
        }
        return true;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in rivalx.action.php)
    */

    function placeToken( int $x, int $y )
    {
        // Check that this player is active and that this action is possible at this moment
        self::checkAction( 'placeToken' );
        $player_id = self::getActivePlayerId();
        // Removes lastPlayed from the previous token
        $sql = "UPDATE board SET board_lastPlayed = -1 WHERE board_lastPlayed = $player_id";
        self::DbQuery( $sql );
        // Adds token to board
        $sql = "UPDATE board SET board_player = $player_id, board_lastPlayed = $player_id WHERE (board_x, board_y) IN (($x,$y))";
        self::DbQuery( $sql );
        // Lowers player's remaining token count
        $sql = "UPDATE player SET player_tokens_left = player_tokens_left - 1 WHERE (player_id) IN ($player_id)";
        self::DbQuery( $sql );
        //Stats
        self::incStat(1, 'tokens_placed', $player_id);
        // Notify
        self::notifyAllPlayers( "playToken", clienttranslate( '${player_name} places a token at (${x}, ${y})' ), array(
            'player_id' => $player_id,
            'player_name' => self::getActivePlayerName(),
            'x' => $x,
            'y' => $y,
            'lastPlayed' => self::getActivePlayerId()
        ) );

        $this->gamestate->nextState( 'placeToken' );
    }

    function finishTurn() {
        self::checkAction('finishTurn');
        self::DbQuery("UPDATE board SET board_selectable = 0 WHERE board_selectable IN (1)");
        $this->gamestate->nextState( 'finishTurn' );
    }

    function placeWild($x,$y) {
        self::checkAction( 'placeWild' );
        $numWilds = self::getNumWilds() + 1;
        $max_wilds = self::MAX_WILDS;
        self::DbQuery( "UPDATE board SET board_player = $numWilds WHERE (board_x, board_y) IN (($x,$y))" );
        self::notifyAllPlayers( "playToken", clienttranslate( '${player_name} places a wild token at (${x}, ${y}), ${numWilds}/${max_wilds} placed' ), array(
            'player_id' => $numWilds,
            'player_name' => self::getActivePlayerName(),
            'x' => $x,
            'y' => $y,
            'numWilds' => $numWilds,
            'max_wilds' => $max_wilds,
            'lastPlayed' => self::getActivePlayerId()
        ) );

        if ($numWilds >= self::MAX_WILDS) {
            $this->gamestate->nextState( 'finishTurn' );
        } else {
            $this->gamestate->nextState( 'placeWild' );
        }
    }

    // Moves the selected wild from one position to another
    function moveWild($old_x, $old_y, $new_x, $new_y) {
        self::checkAction('moveWild');
        $wild_id = self::getObjectFromDb("SELECT board_player id FROM board WHERE (board_x, board_y) IN (($old_x,$old_y))")['id'];
        $curr_player = $this->getCurrentPlayerId();
        self:: DbQuery( "UPDATE board SET board_player = -1, board_selectable = 0, board_lastPlayed = -1 WHERE (board_x, board_y) IN (($old_x,$old_y))"); // remove old wild location
        self:: DbQuery( "UPDATE board SET board_lastPlayed = -1 WHERE board_lastPlayed = $curr_player"); // remove lastPlayed from the last spot the player played
        self:: DbQuery( "UPDATE board SET board_player = $wild_id, board_selectable = 0, board_lastPlayed = $curr_player WHERE (board_x, board_y) IN (($new_x,$new_y))"); // add new wild location
        self::notifyAllPlayers( "moveWild", clienttranslate( '${player_name} moves a wild from (${old_x}, ${old_y}) to (${new_x}, ${new_y})' ), array(
            'player_name' => self::getActivePlayerName(),
            'old_x' => $old_x,
            'old_y' => $old_y,
            'new_x' => $new_x,
            'new_y' => $new_y,
        ) );
        // Statistics
        self::incStat(1, 'wilds_moved', $curr_player);
        $points_to_win = self::POINTS_TO_WIN[$this->getPlayersNumber()];
        if (count(self::checkWildPatternExists($new_x, $new_y, self::getBoard())) > 0) { // A player has achieved a pattern of 5 wilds
            $curr_player = $this->getActivePlayerId();
            self:: DbQuery( "UPDATE player SET player_score = $points_to_win WHERE (player_id) IN ('$curr_player')"); // Give player ridiculous # of points TODO: better implementation method??
            // Notify update scores
            $newScores = self::getCollectionFromDb( "SELECT player_id, player_score FROM player", true );
            self::setStat(2, 'victory_type');
            self::setStat(2, 'victory_type_player', $curr_player);
            self::notifyAllPlayers( "instantWin", clienttranslate('${player_name} has created a pattern of 5 wilds and achieved an instant win!'), array(
                "player_name" => $this->getActivePlayerName(),
            ) );
            self::notifyAllPlayers( "newScores", '', array(
                "scores" => $newScores
            ) );
            $this->gamestate->nextState('endGame');
        } else if (count(self::getCollectionFromDb("SELECT board_player id FROM board WHERE board_selectable = 1")) == 0) { // No selectable tokens left
            $this->gamestate->nextState( 'finishTurn' );
        } else {
            $this->gamestate->nextState( 'moveWild' );
        }
    }

    /*
    
    Example:

    function playCard( $card_id )
    {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction( 'playCard' ); 
        
        $player_id = $this->getActivePlayerId();
        
        // Add your game logic to play a card there 
        ...
        
        // Notify all players about the card played
        $this->notifyAllPlayers( "cardPlayed", clienttranslate( '${player_name} plays ${card_name}' ), array(
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            'card_name' => $card_name,
            'card_id' => $card_id
        ) );
          
    }
    
    */

    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argwildPlacement() {
        return array(
            'possibleMoves' => self::getPossibleMoves('wildPlacement'),
            'numWildsLeft' => self::MAX_WILDS-count(self::getWilds())
        );
    }

    function argplayerTurn() {
        return array( 'possibleMoves' => self::getPossibleMoves('playerTurn'));
    }

    function argrepositionWilds() {
        return array( 'possibleMoves' => self::getPossibleMoves('repositionWilds'));
    }
    /*
    
    Example for game state "MyGameState":
    
    function argMyGameState()
    {
        // Get some values from the current game situation in database...
    
        // return values:
        return array(
            'variable1' => $value1,
            'variable2' => $value2,
            ...
        );
    }    
    */

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */
    
    function stNextPlayer() {
        $board = self::getBoard();
        $patternTokens = self::getPatternTokens($board);
        if (count($patternTokens) > 0) { // A pattern has been made!
            if (self::updateBoardOnPattern($patternTokens, $board)) {
                self::giveExtraTime(self::activeNextPlayer());
                $this->gamestate->nextState('nextTurn');
            } else {
                if (self::checkForPointsWin()) { // Check if any player has hit the required number of points
                    $this->gamestate->nextState('endGame'); 
                } else {
                    $this->gamestate->nextState('repositionWilds');
                }
            }
        }
        else if (!self::allPlayersHaveTokens()) {
            $this->gamestate->nextState('endGame');
        } else {
            self::giveExtraTime(self::activeNextPlayer());
            $this->gamestate->nextState( 'nextTurn' );
        }
    }
    /*
    
    Example for game state "MyGameState":

    function stMyGameState()
    {
        // Do some stuff ...
        
        // (very often) go to another gamestate
        $this->gamestate->nextState( 'some_gamestate_transition' );
    }    
    */

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player )
    {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                case('wildPlacement'):
                    self::zombiePlaceWilds();
                    $this->gamestate->nextState('finishTurn');
                    break;
                case('playerTurn'):
                    $this->gamestate->nextState("placeToken");
                    break;
                case('repostionWilds'):
                    $this->gamestate->nextState("finishTurn");
                    break;
                default:
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );
            
            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb( $from_version )
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}