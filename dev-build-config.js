/* DEV TEST SITE ONLY. This file exists only in floss-fox-dev and must NOT be copied to production (flossfox.com).
   It marks the Smart Stash photo and barcode scanners as "free during testing" so testers can use everything.
   It is not an entitlement: production has no such file, so smart-stash/premium-bridge.js stays fail-closed there.
   Honored only on the dev Pages path and on localhost (local test servers). No storage, no URL flag, no network. */
(function(root){'use strict';
  var l=root.location||{},h=String(l.hostname||''),p=String(l.pathname||'');
  var dev=(h==='therealtenkoshi2020.github.io'&&p.indexOf('/floss-fox-dev/')===0)||h==='localhost'||h==='127.0.0.1';
  root.FlossFoxBuildConfig=Object.freeze({channel:'dev-test',premiumFreeDuringTesting:dev});
})(window);
