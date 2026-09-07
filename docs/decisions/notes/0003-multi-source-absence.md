# 0003. Absence observations name every source scanned

Date: 2026-09-07

Found by the first real run against a live site, which is what that run is for.

An absence established by checking five pages was recorded with `source_id` naming one of them. Every check passed: the source was real, the search scope was recorded, the observation was well formed. It was still wrong in two ways. It credited one page with work done across five, and because coverage counts sources through evidence, the finding built on it was reported as resting on a single source when it rested on five.

`Observation.scanned_source_ids` now carries them, and validation requires it when `search_scope` names more than one place.

The general lesson is worth more than the field. A positive observation has one natural source and an absence does not, and the model had quietly assumed every observation was the first kind. Nothing in the fixture suite caught it, because the fixtures were written by the same reasoning that wrote the model.
