from django.contrib.auth import get_user_model


def create_test_user(username):
    UserModel = get_user_model()
    user = UserModel._meta.default_manager.create(
        **{UserModel.USERNAME_FIELD: username}
    )
    return user
