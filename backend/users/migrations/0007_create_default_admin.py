from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_admin_user(apps, schema_editor):
    User = apps.get_model('users', 'User')
    # Use "DEBOYES" instead of "DEBOYE'S" as single quotes are not allowed in Django usernames
    if not User.objects.filter(username='DEBOYES').exists():
        User.objects.create(
            username='DEBOYES',
            password=make_password('admin123'),
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )

def remove_admin_user(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(username='DEBOYES').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0006_user_batch_open_user_max_batch_size'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, reverse_code=remove_admin_user),
    ]
