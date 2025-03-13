class ScLegacyDbRouter:
    """
    A router to control all database operations on models in the
    auth application.
    """

    def db_for_read(self, model, **hints):
        """
        Attempts to read auth models go to auth_db.
        """
        if model._meta.app_label == "scbp_legacy":
            if model.__module__ == "scbp_legacy.models_orchard":
                return "legacy_orchard"
            if model.__module__ == "scbp_legacy.models_services":
                return "legacy_services"
            return "legacy"
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == "scbp_legacy":
            return "no!"
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label == "scbp_legacy"
            or obj2._meta.app_label == "scbp_legacy"
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == "scbp_legacy":
            return False
        return None
