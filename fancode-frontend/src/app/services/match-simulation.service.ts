import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { take, map } from 'rxjs/operators';

export interface BallCommentary {
  description: string;
  type: 'normal' | 'wicket' | 'boundary' | 'extra';
  detail: string;
}

export interface Ball {
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
  description: string;
  commentary: BallCommentary;
  speed: number;
  battingStyle: string;
  bowlingStyle: string;
}

export interface Over {
  balls: Ball[];
  overNumber: number;
  completed: boolean;
  runsConceded: number;
  wickets: number;
  extras: number;
  bowler: string;
}

export interface PlayerStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOnStrike: boolean;
}

export interface BowlerStats {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface Team {
  name: string;
  flag: string;
  score: number;
  wickets: number;
  overs: Over[];
  runRate: number;
  requiredRunRate?: number;
  batsmen: PlayerStats[];
  bowlers: BowlerStats[];
  powerplayScore?: number;
  lastFiveOversRuns?: number;
}

export interface LiveMatch {
  id: string;
  team1: Team;
  team2: Team;
  currentInnings: 1 | 2;
  status: 'upcoming' | 'live' | 'completed';
  startTime: Date;
  result?: string;
  target?: number;
  isPowerplay: boolean;
  venue: string;
  weather: string;
  pitch: string;
  matchStats: {
    totalFours: number;
    totalSixes: number;
    highestScore: number;
    bestBowling: string;
    partnerships: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class MatchSimulationService {
  private currentMatch = new BehaviorSubject<LiveMatch>({
    id: 'match1',
    team1: this.initializeTeam('India', 'https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg'),
    team2: this.initializeTeam('Australia', 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Australia_%28converted%29.svg'),
    currentInnings: 1,
    status: 'upcoming',
    startTime: new Date(Date.now() + 60 * 1000), // Start in 1 minute
    isPowerplay: true,
    venue: 'Melbourne Cricket Ground',
    weather: 'Sunny, 24°C',
    pitch: 'Good batting surface with even bounce',
    matchStats: {
      totalFours: 0,
      totalSixes: 0,
      highestScore: 0,
      bestBowling: '',
      partnerships: []
    }
  });

  private initializeTeam(name: string, flag: string): Team {
    const batsmen = name === 'India' ? 
      ['Rohit Sharma', 'Virat Kohli', 'Shubman Gill', 'KL Rahul', 'Hardik Pandya', 'Ravindra Jadeja'] :
      ['David Warner', 'Steve Smith', 'Marnus Labuschagne', 'Travis Head', 'Mitchell Marsh', 'Glenn Maxwell'];

    const bowlers = name === 'India' ?
      ['Jasprit Bumrah', 'Mohammed Shami', 'Mohammed Siraj', 'Kuldeep Yadav', 'Ravindra Jadeja'] :
      ['Mitchell Starc', 'Pat Cummins', 'Josh Hazlewood', 'Nathan Lyon', 'Adam Zampa'];

    return {
      name,
      flag,
      score: 0,
      wickets: 0,
      overs: [],
      runRate: 0,
      batsmen: this.initializeBatsmen(batsmen.slice(0, 2)),
      bowlers: this.initializeBowlers(bowlers),
      powerplayScore: 0,
      lastFiveOversRuns: 0
    };
  }

  private initializeBatsmen(names: string[]): PlayerStats[] {
    return names.map((name, index) => ({
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOnStrike: index === 0
    }));
  }

  private initializeBowlers(names: string[]): BowlerStats[] {
    return names.map(name => ({
      name,
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0
    }));
  }

  getCurrentMatch(): Observable<LiveMatch> {
    return this.currentMatch.asObservable();
  }

  startMatch() {
    const match = this.currentMatch.value;
    match.status = 'live';
    this.currentMatch.next(match);
    this.simulateInnings(1);
  }

  private simulateInnings(innings: 1 | 2) {
    let currentOver = 0;
    let ballCount = 0;
    const totalOvers = 5; // 5 overs per innings
    const ballInterval = interval(15000).pipe(take(totalOvers * 6)); // 15 seconds per ball

    ballInterval.subscribe({
      next: () => {
        const ball = this.generateBall();
        const match = this.currentMatch.value;
        const battingTeam = innings === 1 ? match.team1 : match.team2;

        if (!battingTeam.overs[currentOver]) {
          battingTeam.overs[currentOver] = {
            balls: [],
            overNumber: currentOver + 1,
            completed: false,
            runsConceded: 0,
            wickets: 0,
            extras: 0,
            bowler: `Bowler ${(currentOver % 3) + 1}`
          };
        }

        this.updateMatchStats(match, ball);
        this.updatePlayerStats(battingTeam, ball);
        battingTeam.overs[currentOver].balls.push(ball);
        
        ballCount++;
        if (ballCount === 6) {
          battingTeam.overs[currentOver].completed = true;
          this.updateBowlerStats(battingTeam, currentOver);
          currentOver++;
          ballCount = 0;
          
          if (currentOver === 2) { // End of powerplay
            match.isPowerplay = false;
            battingTeam.powerplayScore = battingTeam.score;
          }
        }

        this.updateTeamStats(battingTeam);
        this.currentMatch.next(match);
      },
      complete: () => {
        if (innings === 1) {
          const match = this.currentMatch.value;
          match.currentInnings = 2;
          match.target = match.team1.score + 1;
          match.team2.requiredRunRate = (match.target / totalOvers);
          this.currentMatch.next(match);
          this.simulateInnings(2);
        } else {
          this.completeMatch();
        }
      }
    });
  }

  private generateBall(): Ball {
    const outcomes = [
      { runs: 0, weight: 30, commentary: 'Dot ball' },
      { runs: 1, weight: 25, commentary: 'Single taken' },
      { runs: 2, weight: 15, commentary: 'Good running between the wickets' },
      { runs: 4, weight: 12, commentary: 'Beautiful shot for FOUR' },
      { runs: 6, weight: 8, commentary: 'Maximum! That\'s gone all the way' },
      { runs: 0, weight: 5, isWicket: true, commentary: 'WICKET!' }
    ];

    const battingStyles = ['right-handed', 'left-handed'];
    const bowlingStyles = ['fast', 'medium-fast', 'spin'];
    const wicketTypes = ['caught', 'bowled', 'lbw', 'run out', 'stumped'];
    const speeds = { fast: [135, 150], 'medium-fast': [125, 135], spin: [75, 90] };

    const bowlingStyle = bowlingStyles[Math.floor(Math.random() * bowlingStyles.length)];
    const speedRange = speeds[bowlingStyle as keyof typeof speeds];
    const speed = Math.floor(Math.random() * (speedRange[1] - speedRange[0])) + speedRange[0];

    const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
    let random = Math.random() * totalWeight;

    for (const outcome of outcomes) {
      random -= outcome.weight;
      if (random <= 0) {
        const isExtra = Math.random() < 0.1;
        const extraType = ['wide', 'no-ball', 'bye', 'leg-bye'][Math.floor(Math.random() * 4)] as Ball['extraType'];
        const battingStyle = battingStyles[Math.floor(Math.random() * battingStyles.length)];
        
        let description = outcome.commentary;
        let commentaryType: BallCommentary['type'] = 'normal';
        let detail = '';

        if (outcome.isWicket) {
          const wicketType = wicketTypes[Math.floor(Math.random() * wicketTypes.length)];
          description = `WICKET! ${wicketType}!`;
          commentaryType = 'wicket';
          detail = `Excellent ${wicketType} dismissal`;
        } else if (isExtra) {
          description = `${extraType.toUpperCase()}!`;
          commentaryType = 'extra';
          detail = `Extra run added to the total`;
        } else if (outcome.runs === 4 || outcome.runs === 6) {
          commentaryType = 'boundary';
          detail = outcome.runs === 4 ? 'Ball races to the boundary' : 'Clean hit over the ropes';
        }

        return {
          runs: outcome.runs + (isExtra ? 1 : 0),
          isWicket: outcome.isWicket || false,
          isExtra,
          extraType: isExtra ? extraType : undefined,
          description,
          commentary: {
            description,
            type: commentaryType,
            detail
          },
          speed,
          battingStyle,
          bowlingStyle
        };
      }
    }

    return {
      runs: 0,
      isWicket: false,
      isExtra: false,
      description: 'Dot ball',
      commentary: {
        description: 'Dot ball',
        type: 'normal',
        detail: 'Good defensive shot'
      },
      speed: 0,
      battingStyle: battingStyles[0],
      bowlingStyle: bowlingStyles[0]
    };
  }

  private updateMatchStats(match: LiveMatch, ball: Ball) {
    if (ball.runs === 4) match.matchStats.totalFours++;
    if (ball.runs === 6) match.matchStats.totalSixes++;
  }

  private updatePlayerStats(team: Team, ball: Ball) {
    const striker = team.batsmen.find(b => b.isOnStrike);
    if (striker) {
      striker.balls++;
      striker.runs += ball.runs;
      if (ball.runs === 4) striker.fours++;
      if (ball.runs === 6) striker.sixes++;
      striker.strikeRate = (striker.runs / striker.balls) * 100;
    }

    if (!ball.isExtra && ball.runs % 2 === 1) {
      team.batsmen.forEach(b => b.isOnStrike = !b.isOnStrike);
    }
  }

  private updateBowlerStats(team: Team, overIndex: number) {
    const over = team.overs[overIndex];
    const bowler = team.bowlers.find(b => b.name === over.bowler);
    if (bowler) {
      bowler.overs++;
      bowler.runs += over.runsConceded;
      bowler.wickets += over.wickets;
      bowler.economy = bowler.runs / bowler.overs;
      if (over.runsConceded === 0) bowler.maidens++;
    }
  }

  private updateTeamStats(team: Team) {
    team.score = team.overs.reduce((total, over) => 
      total + over.balls.reduce((overTotal, ball) => overTotal + ball.runs, 0), 0);
    
    team.wickets = team.overs.reduce((total, over) => 
      total + over.balls.filter(ball => ball.isWicket).length, 0);
    
    const totalOvers = team.overs.length - 1;
    const ballsInCurrentOver = team.overs[totalOvers]?.balls.length || 0;
    const oversDecimal = totalOvers + (ballsInCurrentOver / 6);
    team.runRate = team.score / (oversDecimal || 1);

    // Calculate last 5 overs runs
    const lastFiveOvers = team.overs.slice(-5);
    team.lastFiveOversRuns = lastFiveOvers.reduce((total, over) => 
      total + over.balls.reduce((overTotal, ball) => overTotal + ball.runs, 0), 0);
  }

  private completeMatch() {
    const match = this.currentMatch.value;
    match.status = 'completed';
    
    const team1Score = match.team1.score;
    const team2Score = match.team2.score;
    
    // Update match statistics
    match.matchStats.highestScore = Math.max(team1Score, team2Score);
    const bestBowler = [...match.team1.bowlers, ...match.team2.bowlers]
      .reduce((best, current) => (current.wickets > best.wickets || 
        (current.wickets === best.wickets && current.runs < best.runs)) ? current : best);
    match.matchStats.bestBowling = `${bestBowler.name}: ${bestBowler.wickets}/${bestBowler.runs}`;
    
    if (team1Score > team2Score) {
      match.result = `${match.team1.name} won by ${team1Score - team2Score} runs`;
    } else if (team2Score > team1Score) {
      match.result = `${match.team2.name} won by ${10 - match.team2.wickets} wickets`;
    } else {
      match.result = 'Match tied!';
    }
    
    this.currentMatch.next(match);
  }
}
