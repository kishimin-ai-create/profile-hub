# infra

Infrastructure configuration for profile-hub.

This directory is empty on purpose. The deployment target is Sakura Cloud AppRun, and the decisions
that shape what belongs here — how the two static frontends are served, how MySQL is reached and
which sources may connect to it, how migrations are applied, and how backups are taken — are made in
the deployment issue, not here.

`render.yaml` at the repository root still targets Render with the predecessor's `diary-*` service
names. It is superseded and is deleted or replaced by the same issue.
