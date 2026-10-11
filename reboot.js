'use strict';
'require view';
'require rpc';
'require ui';
'require uci';

/* 重启页（替换 luci-mod-system 自带的 reboot.js）
 * 与 luci-app-poweroff 同风格：圆形按钮 + 标题，无外框。
 * 点击后弹出确认；确认后显示绿色旋转图标和“设备正在重启中，请稍候……”（无倒计时），
 * 设备重新上线后自动刷新页面。 */

var callReboot = rpc.declare({
	object: 'system',
	method: 'reboot',
	expect: { result: 0 }
});

var css = [
	".rb-card { max-width:420px; margin:2em auto; padding:2.2em 1.5em 1.8em; text-align:center; }",
	".rb-btn { position:relative; width:112px; height:112px; padding:0; border:0; border-radius:50%; cursor:pointer; outline:none;",
	"  background:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCc+PGcgZmlsbD0nbm9uZScgc3Ryb2tlPSd3aGl0ZScgc3Ryb2tlLXdpZHRoPSc1LjUnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCc+PHBhdGggZD0nTTEzLjIgMjUuMkEyMCAyMCAwIDAgMSA1MC44IDI1LjInLz48cGF0aCBkPSdNMTMuMiAyNS4yQTIwIDIwIDAgMCAxIDUwLjggMjUuMicgdHJhbnNmb3JtPSdyb3RhdGUoMTgwIDMyIDMyKScvPjwvZz48ZyBmaWxsPSd3aGl0ZScgc3Ryb2tlPSd3aGl0ZScgc3Ryb2tlLXdpZHRoPScyJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJz48cG9seWdvbiBwb2ludHM9JzU3LDIyLjUgNDQuNSwyNyA1My41LDMyLjUnLz48cG9seWdvbiBwb2ludHM9JzU3LDIyLjUgNDQuNSwyNyA1My41LDMyLjUnIHRyYW5zZm9ybT0ncm90YXRlKDE4MCAzMiAzMiknLz48L2c+PC9zdmc+) center / 52% no-repeat, linear-gradient(145deg,#ffb347,#ef8200);",
	"  box-shadow:0 8px 20px rgba(239,130,0,.45), inset 0 2px 4px rgba(255,255,255,.35);",
	"  transition:transform .15s ease, box-shadow .2s ease, filter .2s ease;",
	"  animation:rb-pulse 2.4s ease-in-out infinite; }",
	".rb-btn:hover { transform:scale(1.06); filter:brightness(1.08); box-shadow:0 12px 28px rgba(239,130,0,.6), inset 0 2px 4px rgba(255,255,255,.4); }",
	".rb-btn:active { transform:scale(.94); box-shadow:0 3px 10px rgba(239,130,0,.5), inset 0 3px 8px rgba(0,0,0,.25); }",
	".rb-btn:focus-visible { box-shadow:0 0 0 4px rgba(239,130,0,.35), 0 8px 20px rgba(239,130,0,.45); }",
	".rb-title { margin:1.1em 0 .3em; font-size:1.15em; font-weight:600; }",
	"@keyframes rb-pulse {",
	"  0%,100% { box-shadow:0 8px 20px rgba(239,130,0,.45), 0 0 0 0 rgba(239,130,0,.35), inset 0 2px 4px rgba(255,255,255,.35); }",
	"  50% { box-shadow:0 8px 20px rgba(239,130,0,.45), 0 0 0 16px rgba(239,130,0,0), inset 0 2px 4px rgba(255,255,255,.35); }",
	"}",
	".rb-spin { width:72px; height:72px; margin:.2em auto .6em; background:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCc+PGcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMmU5ZTViJyBzdHJva2Utd2lkdGg9JzUuNScgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJz48cGF0aCBkPSdNMTMuMiAyNS4yQTIwIDIwIDAgMCAxIDUwLjggMjUuMicvPjxwYXRoIGQ9J00xMy4yIDI1LjJBMjAgMjAgMCAwIDEgNTAuOCAyNS4yJyB0cmFuc2Zvcm09J3JvdGF0ZSgxODAgMzIgMzIpJy8+PC9nPjxnIGZpbGw9JyMyZTllNWInIHN0cm9rZT0nIzJlOWU1Yicgc3Ryb2tlLXdpZHRoPScyJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJz48cG9seWdvbiBwb2ludHM9JzU3LDIyLjUgNDQuNSwyNyA1My41LDMyLjUnLz48cG9seWdvbiBwb2ludHM9JzU3LDIyLjUgNDQuNSwyNyA1My41LDMyLjUnIHRyYW5zZm9ybT0ncm90YXRlKDE4MCAzMiAzMiknLz48L2c+PC9zdmc+) center / contain no-repeat; animation:rb-spin 1.2s linear infinite; }",
	".rb-ok { margin:0; text-align:center; font-size:1.25em; font-weight:700; line-height:1.5; color:#2e9e5b; }",
	"@keyframes rb-spin { to { transform:rotate(360deg); } }",
	"@media (prefers-reduced-motion:reduce) { .rb-btn { animation:none; transition:none; } .rb-spin { animation-duration:4s; } }"
].join("\n");

return view.extend({
	load: function() {
		return uci.changes();
	},

	render: function(changes) {
		this.btn = E('button', {
			'class': 'rb-btn',
			'type': 'button',
			'title': _('Perform reboot'),
			'click': L.bind(this.handleReboot, this)
		});

		this.title = E('div', { 'class': 'rb-title' }, _('Perform reboot'));

		this.busy = E('div', { 'style': 'display:none' }, [
			E('div', { 'class': 'rb-spin' }),
			E('p', { 'class': 'rb-ok' }, '设备正在重启中，请稍候……')
		]);

		var body = E([
			E('style', {}, css),
			E('h2', { 'name': 'content' }, _('Reboot')),
			E('div', { 'class': 'cbi-map-descr' }, _('Reboots the operating system of your device'))
		]);

		for (var config in (changes || {})) {
			body.appendChild(E('p', { 'class': 'alert-message warning' },
				_('Warning: There are unsaved changes that will get lost on reboot!')));
			break;
		}

		body.appendChild(E('div', { 'class': 'rb-card' }, [ this.btn, this.title, this.busy ]));

		return body;
	},

	setBusy: function(on) {
		this.btn.style.display = on ? 'none' : '';
		this.title.style.display = on ? 'none' : '';
		this.busy.style.display = on ? '' : 'none';
	},

	/* 静默等待设备重新上线，上线后自动刷新 */
	waitForDevice: function() {
		if (typeof ui.awaitReconnect == 'function') {
			ui.awaitReconnect();
			return;
		}

		var ping = function() {
			var img = new Image();
			img.onload = function() { window.location.reload(); };
			img.onerror = function() { window.setTimeout(ping, 3000); };
			img.src = L.resource('icons/loading.gif') + '?' + Math.random();
		};

		window.setTimeout(ping, 20000);
	},

	handleReboot: function(ev) {
		if (!confirm('确定要重启设备吗？'))
			return;

		this.setBusy(true);

		return callReboot().then(L.bind(function(res) {
			if (res != 0) {
				this.setBusy(false);
				ui.addNotification(null, E('p', _('The reboot command failed with code %d').format(res)));
				return;
			}

			this.waitForDevice();
		}, this)).catch(L.bind(function(e) {
			this.setBusy(false);
			ui.addNotification(null, E('p', e.message));
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
