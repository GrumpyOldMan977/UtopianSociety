# Laptop optimization

This is a reversible startup optimization for the current Windows installation.

The apply script:

- prevents Adobe collaboration sync and Epson's update navigator from starting
  with Windows while preserving their commands for restoration;
- disables Intel usage-reporting telemetry;
- changes Intel Driver & Support Assistant to on-demand;
- disables HP JumpStart;
- changes HP Support Assistant and HP Comm Recovery to on-demand;
- disables Epson customer-research collection.

It does not disable Windows Security, hardware drivers, Epson print/scan
services, OneDrive data, Adobe security updates, or the Utopian Society local
site and Worker tasks.

Run `restore-low-risk-optimization.ps1` as administrator to restore the
original automatic startup behavior.
