# Source attribution

Utopia Fleet Builder: https://github.com/AngryTribble/Star-Trek-Attack-Wing-Utopia

Pinned commit: 478c9779ec901d2bae2a60d1aec625dcace0f148. Upstream package license: LGPL-3.0.

The preserved source is in vendor/utopia. Its AngularJS rules engine and jQuery helpers run locally. Their original source headers and licenses are retained. The new application uses Utopia's card loader, equipment rules, cost interceptors, and fleet operations through an adapter; it does not use upstream page templates.

Fonts (Swiss1.ttf, Alternate1.ttf, AttackWingSymbols.ttf) and small UI icons are preserved from Utopia. Card-front scans are extracted from the images already referenced by the user's TTS save. No generated replacement card art is used.

Local image transformation uses sharp only during development; it is not shipped as a browser dependency. Playwright and Fengari are optional development test tools.
