/* Authored responsive device choreography: pure keyframes for PixiraKinematics.curve (desktop stays in flow-kinematics.js). */
(()=>{
'use strict';
const f=(t,x,y,s,rx,ry,rz)=>({t,x,y,s,rx,ry,rz});
// Mobile: upright camera on a short vertical arc. Each native chapter = face-on lift (largest s, near-zero roll/pitch) then one three-quarter turn that dips low and small.
const MOBILE_CAPTURE=[
 f(0,  .46,.56,.84, 14, 20,-4), // rises from below, tipped back
 f(.17,.50,.50,1.05, 1, -3, 0), // picker: face-on read (yaw overshoot = brief hold)
 f(.32,.46,.54,.90, -8, 30,-5), // transition: decisive three-quarter turn, dips
 f(.44,.50,.48,1.08, 2, -2, 0), // live controls: lift face-on
 f(.56,.52,.51,1.00, -6,-14, 2), // depth breath, leaning into next chapter
 f(.67,.54,.55,.88, 10,-32, 6), // turn to the other side at copy change
 f(.80,.50,.47,1.10, -1,  2, 0), // optics: highest, largest lift
 f(.91,.49,.49,1.05,  2,  8,-1), // optics read, slow drift
 f(1,  .47,.52,.96,  6, 18,-3)  // exit three-quarter
];
const MOBILE_FILM=[
 f(0,  .54,.47,.86,-12,-24, 5), // drops in from above, tipped forward (mirror of capture entry)
 f(.13,.50,.51,1.04, 2,  3, 0), // redevelop: face-on read
 f(.30,.46,.55,.88, 10, 32,-6), // turn into edit, dips
 f(.42,.50,.48,1.09,-1, -2, 0), // edit: lift face-on
 f(.55,.52,.52,1.00, 6,-10, 2), // pitch-led depth breath while sliders move
 f(.67,.54,.55,.87,-9,-30, 6), // turn into Photos Original
 f(.79,.50,.48,1.07, 1,  2, 0), // Photos Original: lift
 f(1,  .50,.50,1.00, 0,  0, 0)  // flat centre for the photo dolly
];
// Tablet: wide two-column stage. Diagonal cross through centre with counter-orbiting yaw, then a depth oval at the reading anchor.
const TABLET_CAPTURE=[
 f(0,  .73,.42,.84, 12,-32, 7),
 f(.14,.71,.54,1.02, 2,-10, 2),
 f(.23,.69,.60,.84,-6,-24,-3),
 f(.30,.50,.53,1.04,-2,  4, 0),
 f(.36,.50,.61,1.04,-2,  4, 0),
 f(.44,.29,.56,.92,  5, 18,-2),
 f(.49,.27,.43,.88,  9, 26,-4),
 f(.60,.31,.52,1.05,-3,  6, 1),
 f(.73,.23,.59,.88,-8,-16, 3),
 f(.87,.28,.50,1.02, 3,  6,-1),
 f(1,  .31,.44,.88, 6, 18,-3)
];
const TABLET_FILM=[
 f(0,  .27,.58,.84,-11, 32,-7),
 f(.14,.29,.49,1.03,-1, 10,-1),
 f(.23,.31,.40,.84,  7, 24, 3),
 f(.30,.50,.53,1.04, 1, -4, 0),
 f(.36,.50,.61,1.04, 1, -4, 0),
 f(.44,.71,.56,.92, -4,-18, 2),
 f(.49,.73,.59,.88,-8,-26, 4),
 f(.60,.69,.50,1.05, 2, -6,-1),
 f(.73,.77,.42,.88, 10, 18,-3),
 f(.86,.72,.51,1.03,-2, -8, 1),
 f(1,  .50,.50,1.00, 0,  0, 0)
];
const freeze=list=>Object.freeze(list.map(Object.freeze));
globalThis.PixiraAuthoredDeviceProfiles=Object.freeze({
 version:'2026-11-05-codesign-v3',
 mobile:Object.freeze({capture:freeze(MOBILE_CAPTURE),film:freeze(MOBILE_FILM)}),
 tablet:Object.freeze({capture:freeze(TABLET_CAPTURE),film:freeze(TABLET_FILM)})
});
})();
