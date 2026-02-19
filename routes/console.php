<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('vcfwizard:cleanup')->everyMinute();
