import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-scorecard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-scorecard.component.html',
  styleUrls: ['./live-scorecard.component.scss']
})
export class LiveScorecardComponent implements OnInit {
  currentInnings = 1;
  team1Score = { runs: 0, wickets: 0, overs: 0 };
  team2Score = { runs: 0, wickets: 0, overs: 0 };
  battingStats: any[] = [];
  bowlingStats: any[] = [];
  recentBalls: any[] = [];
  partnership = { runs: 0, balls: 0 };
  currentBatsmen = { striker: '', nonStriker: '' };
  currentBowler = '';
  requiredRunRate = 0;
  projectedScore = 0;

  constructor() { }

  ngOnInit(): void {
    this.initializeData();
  }

  private initializeData() {
    // Initialize batting stats
    this.battingStats = [
      { name: 'Rohit Sharma', runs: 45, balls: 32, fours: 4, sixes: 2, strikeRate: 140.63, isOut: false },
      { name: 'Virat Kohli', runs: 82, balls: 54, fours: 7, sixes: 3, strikeRate: 151.85, isOut: false }
    ];

    // Initialize bowling stats
    this.bowlingStats = [
      { name: 'Mitchell Starc', overs: 3.2, maidens: 0, runs: 28, wickets: 2, economy: 8.40 }
    ];

    // Initialize team scores
    this.team1Score = { runs: 167, wickets: 4, overs: 18.2 };
    this.team2Score = { runs: 0, wickets: 0, overs: 0 };

    // Initialize current players
    this.currentBatsmen = {
      striker: 'Virat Kohli',
      nonStriker: 'KL Rahul'
    };
    this.currentBowler = 'Mitchell Starc';

    // Initialize partnership
    this.partnership = { runs: 94, balls: 52 };

    // Calculate required run rate
    this.calculateRequiredRunRate();
  }

  private calculateRequiredRunRate() {
    const remainingBalls = (20 * 6) - (this.team2Score.overs * 6);
    const remainingRuns = this.team1Score.runs + 1 - this.team2Score.runs;
    this.requiredRunRate = (remainingRuns / remainingBalls) * 6;
    this.projectedScore = this.team2Score.runs + (this.team2Score.runs / (this.team2Score.overs || 1)) * (20 - this.team2Score.overs);
  }
}
