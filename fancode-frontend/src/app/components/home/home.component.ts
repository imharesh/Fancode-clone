import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { LiveScorecardComponent } from '../live-scorecard/live-scorecard.component';

interface BallUpdate {
  over: number;
  ball: number;
  commentary: string;
  runs: number;
  isWicket: boolean;
  isFour: boolean;
  isSix: boolean;
}

interface LiveMatch {
  id: number;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  currentBatsman: string;
  currentBowler: string;
  status: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    LiveScorecardComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  faSearch = faSearch;
  faFilter = faFilter;
  liveMatches: LiveMatch[] = [
    {
      id: 1,
      team1: 'India',
      team2: 'Australia',
      score1: '245/6 (42.3)',
      score2: '-',
      currentBatsman: 'V Kohli (85*)',
      currentBowler: 'P Cummins',
      status: 'Live'
    },
    {
      id: 2,
      team1: 'England',
      team2: 'New Zealand',
      score1: '189/4 (35.0)',
      score2: '-',
      currentBatsman: 'J Root (62*)',
      currentBowler: 'T Boult',
      status: 'Live'
    }
  ];

  ballByBallUpdates: BallUpdate[] = [
    {
      over: 42,
      ball: 3,
      commentary: 'Kohli drives through the covers for a brilliant boundary!',
      runs: 4,
      isWicket: false,
      isFour: true,
      isSix: false
    },
    {
      over: 42,
      ball: 2,
      commentary: 'Single taken with a push to mid-off',
      runs: 1,
      isWicket: false,
      isFour: false,
      isSix: false
    },
    {
      over: 42,
      ball: 1,
      commentary: 'WICKET! Smith takes a stunning catch at slip!',
      runs: 0,
      isWicket: true,
      isFour: false,
      isSix: false
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  getBallClass(ball: BallUpdate): string {
    if (ball.isWicket) return 'wicket';
    if (ball.isSix) return 'six';
    if (ball.isFour) return 'four';
    return '';
  }

  getOverNumber(over: number, ball: number): string {
    return `${over}.${ball}`;
  }

  getOversString(overs: number): string {
    const fullOvers = Math.floor(overs);
    const balls = Math.round((overs - fullOvers) * 10);
    return `${fullOvers}.${balls}`;
  }

  getRunRate(score: number, overs: number): string {
    if (overs === 0) return '0.00';
    return (score / overs).toFixed(2);
  }
}
