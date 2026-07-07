from django.db import migrations


def classify_storage_location_types(apps, schema_editor):
    StorageLocation = apps.get_model("inventory", "StorageLocation")

    StorageLocation.objects.filter(code__startswith="WE-").update(
        location_type="RECEIVING"
    )

    StorageLocation.objects.filter(code__startswith="WA-").update(
        location_type="SHIPPING"
    )

    StorageLocation.objects.exclude(code__startswith="WE-").exclude(
        code__startswith="WA-"
    ).update(location_type="STORAGE")


def reverse_classify_storage_location_types(apps, schema_editor):
    StorageLocation = apps.get_model("inventory", "StorageLocation")
    StorageLocation.objects.all().update(location_type="STORAGE")


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0021_storage_location_type"),
    ]

    operations = [
        migrations.RunPython(
            classify_storage_location_types,
            reverse_classify_storage_location_types,
        ),
    ]
