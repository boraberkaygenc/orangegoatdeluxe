// Preloaded into server.mjs by launcher\gnc.mjs (node -r). Lets the hidden keeper stop the server cleanly on Windows,
// where there are no signals: on "gnc-shutdown" the server's own SIGTERM handler runs (saves the store, then exits).
if (process.send) {
  process.on('message', m => {
    if (m !== 'gnc-shutdown') return;
    if (process.listenerCount('SIGTERM')) process.emit('SIGTERM', 'SIGTERM'); else process.exit(0);
  });
  // the channel must not keep the server alive on its own, and the server keeps running if the keeper is gone
  if (process.channel && process.channel.unref) process.channel.unref();
}
