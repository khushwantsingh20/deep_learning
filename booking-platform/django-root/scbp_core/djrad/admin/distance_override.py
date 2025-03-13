import codecs
import csv

from django.db import transaction
from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.settings import api_settings

from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models.pricing import DistanceOverride


class DistanceOverrideSerializer(ScbpAdminModelSerializer):
    bidirectional_update = serializers.BooleanField(default=True)

    class Meta:
        model = DistanceOverride
        fields = (
            "from_suburb",
            "from_postcode",
            "to_suburb",
            "to_postcode",
            "fixed_distance",
            "bidirectional_update",
        )

    def create_or_update_reverse(self, validated_data):
        record, created = DistanceOverride.objects.get_or_create(
            from_suburb=validated_data["to_suburb"],
            from_postcode=validated_data["to_postcode"],
            to_suburb=validated_data["from_suburb"],
            to_postcode=validated_data["from_postcode"],
            defaults=dict(fixed_distance=validated_data["fixed_distance"]),
        )
        if not created:
            record.fixed_distance = validated_data["fixed_distance"]
            record.save()

    def update(self, instance, validated_data):
        bidirectional_update = validated_data.pop("bidirectional_update", True)
        updated_instance = super().update(instance, validated_data)
        if bidirectional_update:
            self.create_or_update_reverse(validated_data)
        return updated_instance

    def create(self, validated_data):
        bidirectional_update = validated_data.pop("bidirectional_update", True)
        instance = super().create(validated_data)
        if bidirectional_update:
            self.create_or_update_reverse(validated_data)
        return instance


class DistanceOverrideViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "upload_csv": ["%(app_label)s.add_%(model_name)s"],
    }


class DistanceOverrideFilterSet(filters.FilterSet):
    keywords = filters.CharFilter(method="keyword_filter", label="Search")

    class Meta:
        model = DistanceOverride
        fields = ("keywords",)

    def keyword_filter(self, qs, name, keywords):
        return qs.filter(
            Q(from_suburb__icontains=keywords)
            | Q(to_suburb__icontains=keywords)
            | Q(from_postcode__icontains=keywords)
            | Q(to_postcode__icontains=keywords)
        )


class DistanceOverrideViewSet(ScbpAdminModelViewSet):
    serializer_class = DistanceOverrideSerializer
    queryset = DistanceOverride.objects.all()
    permission_classes = (DistanceOverrideViewSetPermissions,)
    filterset_class = DistanceOverrideFilterSet

    @action(detail=False, methods=["POST"], url_path="upload-csv")
    def upload_csv(self, request):
        bidirectional = request.data["bidirectional"]
        file = request.data["file"]
        reader = csv.DictReader(codecs.iterdecode(file, "utf-8"))
        required_fields = [
            "from suburb",
            "from postcode",
            "to suburb",
            "to postcode",
            "distance",
        ]
        missing_fields = [
            field for field in required_fields if field not in reader.fieldnames
        ]
        if missing_fields:
            raise ValidationError(
                {
                    api_settings.NON_FIELD_ERRORS_KEY: f"Missing required columns: {missing_fields}"
                }
            )

        def create_override(
            from_postcode,
            to_postcode,
            distance,
            from_suburb="",
            to_suburb="",
            create_birectional=False,
        ):
            override, created = DistanceOverride.objects.get_or_create(
                from_suburb=from_suburb.strip(),
                from_postcode=from_postcode.strip(),
                to_suburb=to_suburb.strip(),
                to_postcode=to_postcode.strip(),
                defaults=dict(fixed_distance=distance),
            )
            if not created:
                override.fixed_distance = row["distance"]
                override.save()
            if create_birectional:
                create_override(
                    from_suburb=to_suburb,
                    from_postcode=to_postcode,
                    to_suburb=from_suburb,
                    to_postcode=from_postcode,
                    distance=distance,
                    create_birectional=False,
                )

        with transaction.atomic():
            for row in reader:
                create_override(
                    from_suburb=row["from suburb"].strip(),
                    from_postcode=row["from postcode"].strip(),
                    to_suburb=row["to suburb"].strip(),
                    to_postcode=row["to postcode"].strip(),
                    distance=row["distance"],
                    create_birectional=bidirectional,
                )
                if "default" in reader.fieldnames and row["default"].strip():
                    create_override(
                        from_postcode=row["from postcode"].strip(),
                        to_postcode=row["to postcode"].strip(),
                        distance=row["distance"],
                        create_birectional=bidirectional,
                    )
        return Response(
            self.get_serializer(DistanceOverride.objects.all(), many=True).data
        )


class DistanceOverrideRegistration(ScbpAdminModelRegistration):
    viewset_class = DistanceOverrideViewSet


admin_site.register(DistanceOverride, DistanceOverrideRegistration)
