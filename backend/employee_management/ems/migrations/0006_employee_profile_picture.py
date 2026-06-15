from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ems', '0005_alter_leave_leave_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='profile_picture',
            field=models.ImageField(
                blank=True,
                null=True,
                default='profile_pictures/default_profile.png',
                upload_to='profile_pictures/',
            ),
        ),
    ]
