// Fractional deadlines keep a 60 FPS cap even across 144/240 Hz refresh rates.
export function createFrameClock(){
 let last=null,due=0,previousCap=null;
 return {reset(){last=null;due=0;previousCap=null;},advance(now,cap=60){const interval=cap>0?1000/cap:0;if(last===null){last=now;due=now+interval;previousCap=cap;return 0;}if(cap!==previousCap){due=now;previousCap=cap;}if(interval&&now+.2<due)return null;const elapsed=now-last;last=now;if(interval){due+=interval;while(due<=now-.2)due+=interval;}else due=now;return elapsed;}};
}
